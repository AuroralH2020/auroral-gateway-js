import { client, xml } from '@xmpp/client'
import EventEmmiter from 'node:events'
import crypto from 'crypto'
import { XMPPMessage, XMPPErrorMessage, RosterItem, RequestOperation, MessageType, Options, SubscribeChannelOpt,  NotificationOpt, RecordStatusCode } from '../types/xmpp-types'
import { HttpStatusCode, logger, errorHandler, MyError } from '../utils'
import { Config } from '../config'
import { JsonType } from '../types/misc-types'
import { agent } from '../connectors/agent-connector'
import { events } from './events'
import { reloadAllRosters } from './xmpp'
import { addRecord } from './records'

export class XMPP {

  // Class variables

  readonly oid: string
  private rosterItemsOid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterItemsJid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterReloadTimer: NodeJS.Timer | undefined = undefined
  private msgTimeouts: Map<number, NodeJS.Timeout> = new Map<number, NodeJS.Timeout>() // Timers to timeout requests
  private msgEvents: EventEmmiter = new EventEmmiter() // Handles events inside this class
  // private eventChannels: Map<string, EventHandler> = new Map<string, EventHandler>()
  public client

  public constructor(oid: string, password: string) {
    this.oid = oid
    this.client = this.createClient(oid, password)
    logger.info('AURORAL item with ID ' + this.oid + ' was added to the Node XMPP clients pool')
    // Listeners
    this.client.on('error', (err: unknown) => {
      this.onError(err)
    })
    this.client.on('offline', () => {
      this.onOffline()
    })
    this.client.on('online', () => {
      this.onOnline()
    })
    this.client.on('stanza', (stanza: any) => {
      this.onStanza(stanza)
    })
  }

  // Public methods

  public async start() {
    this.client.start({}).catch(
      (err: unknown) => {
        const error = errorHandler(err)
        if (error.message !== 'Connection is not offline') {
          logger.error('XMPP connection for oid ' + this.oid + ' could not be established')
          logger.error(error.message)
        }
      })
  }

  public async stop(): Promise<void> {
    try {
      await this.client.send(xml('presence', { type: 'unavailable' }))
      await this.client.stop()
    } catch (err: unknown) {
      const error = errorHandler(err)
      logger.error(this.oid + 'disconnection error: ' + error.message)
    }
  }

  public async sendStanza(destinationOid: string, body: JsonType | null, requestOperation: RequestOperation, messageType: MessageType, attributes: JsonType, parameters: JsonType, callback: (err: boolean, message: JsonType) => void) {
    try {
      // Check if destination is in roster
      // Works in AURORAL, update for federated scenario!!! Same OID under different domain would be possible
      const jid = this.rosterItemsOid.get(destinationOid)?.jid
      if (!jid) {
        logger.warn('Destination ' + destinationOid + ' is not in the roster of ' + this.oid)
        throw new MyError('Destination OID not found in roster, aborting message', HttpStatusCode.NOT_FOUND)
      }

      // Add random ID to the request
      const requestId = crypto.randomBytes(4).readUInt32BE()

      // Create message payload
      const payload: XMPPMessage = { messageType, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: body, responseBody: null, parameters, attributes }

      // Build XML and send message
      const message = xml(
        'message',
        { type: 'chat', to: jid },
        xml('body', {}, JSON.stringify(payload)),
      )
      await this.client.send(message)
      logger.debug('Message sent by ' + this.oid + ' through XMPP network... Destination ' + destinationOid)

      if (messageType === MessageType.EVENT) {
        // IN CASE OF EVENT -- If ACK wait / If NO ACK return inmediately
        // @TBD Control case event has ACK
        await addRecord(requestOperation, requestId, this.oid, destinationOid, JSON.stringify(body), RecordStatusCode.MESSAGE_OK, true)
        callback(false, {})
      } else {
        // IN CASE OF REQUEST -- Waiting for event response or timeout
        const timeout = setTimeout(
          async (error, message2) => {
            this.msgEvents.removeAllListeners(String(requestId))
            await addRecord(requestOperation, requestId, this.oid, destinationOid, '', RecordStatusCode.RESPONSE_NOT_RECEIVED, true)
            callback(error, message2)
          }, Number(Config.NM.TIMEOUT), true, { error: 'Timeout awaiting response (10s)', status: HttpStatusCode.REQUEST_TIMEOUT }, callback
        )
        this.msgTimeouts.set(requestId, timeout) // Add to timeout list
        this.msgEvents.on(String(requestId), async (data) => {
          // Cancel timeout
          const timeoutToCancel = this.msgTimeouts.get(requestId)
          clearTimeout(timeoutToCancel)
          this.msgTimeouts.delete(requestId)
          // Remove listener
          this.msgEvents.removeAllListeners(String(requestId))
          if (data.error) {
            // @TBD Decide how to treat XMPP success with error message from different gtw, new record status code??? Size of message 0???
            await addRecord(requestOperation, requestId, this.oid, destinationOid, '', RecordStatusCode.MESSAGE_OK, true)
            // Throw error
            callback(true, data)
          }
          // Return response (NORMAL SCENARIO)
          await addRecord(requestOperation, requestId, this.oid, destinationOid, JSON.stringify(data), RecordStatusCode.MESSAGE_OK, true)
          callback(false, data)
        })
      }
    } catch (err: unknown) {
      const error = errorHandler(err)
      logger.error(error.message)
      await addRecord(requestOperation, 0, this.oid, destinationOid, '', RecordStatusCode.MESSAGE_NOT_SENT, true)
      throw new MyError(error.message, HttpStatusCode.SERVICE_UNAVAILABLE)
    }
  }

  // Return object roster
  public async getRoster() {
    const roster: string[] = []
    this.rosterItemsOid.forEach(it => {
      roster.push(it.name)
      // logger.debug(it)
    })
    return roster
  }

  // @TBD improve this function by calculating the difference and adding/removing items based on that
  // This way we do not remove from roster any items that should be there for any amount of time
  public async reloadRoster() {
    logger.info('Reloading roster of oid ' + this.oid + '...')
    const roster = await this.client.iqCaller.get(xml('query', 'jabber:iq:roster'))
    const rosterItems = roster.getChildren('item', 'jabber:iq:roster')
    this.rosterItemsOid.clear()
    this.rosterItemsJid.clear()
    for (let i = 0, l = rosterItems.length; i < l; i++) {
      this.rosterItemsJid.set(rosterItems[i].attrs.jid, rosterItems[i].attrs)
      this.rosterItemsOid.set(rosterItems[i].attrs.name, rosterItems[i].attrs)
    }
  }

  // Private methods

  private createClient(oid: string, password: string) {
    return client({
      service: Config.XMPP.SERVICE,
      domain: Config.XMPP.DOMAIN,
      resource: Config.XMPP.RESOURCE,
      username: oid,
      password
    })
  }

  private async respondStanza(destinationOid: string, jid: string, requestId: number, requestOperation: number, body: JsonType | null, _attributes: JsonType, _parameters: JsonType) {
    const payload: XMPPMessage = { messageType: 2, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: null, responseBody: body, parameters: {}, attributes: {} }
    const message = xml(
      'message',
      { type: 'chat', to: jid },
      xml('body', {}, JSON.stringify(payload)),
    )
    await this.client.send(message)
  }

  private async respondStanzaWithError(destinationOid: string, jid: string, requestId: number, requestOperation: number, errorMessage: string, statusCode: number) {
    const payload: XMPPErrorMessage = { messageType: 2, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, errorMessage, statusCode }
    const message = xml(
      'message',
      { type: 'error', to: jid },
      xml('error', {}, JSON.stringify(payload)),
    )
    await this.client.send(message)
  }

  // XMPP Listeners

  private onError(err: unknown) {
    const error = errorHandler(err)
    logger.error(error.message)
  }

  private onOffline() {
    logger.info('XMPP client with oid ' + this.oid + ' disconnected')
    clearInterval(this.rosterReloadTimer)
  }

  private onOnline() {
    logger.info('XMPP client with oid ' + this.oid + ' was logged in!')
    // Makes itself available
    this.client.send(xml('presence'))
    // Reload roster
    this.reloadRoster()
    this.rosterReloadTimer = setInterval(() => {
      this.reloadRoster()
    }, Number(Config.XMPP.ROSTER_REFRESH)) // 10 min
  }

  private async onStanza(stanza: any) {
    if (!stanza.is('message')) {
      // I.e. presence, ...
      // logger.debug('Stanza received: Not message type')
      // logger.debug(stanza.toString())
      return
    }
    const { _to, from, type } = stanza.attrs as { _to: string, from: string, type: string }
    // ERROR
    if (type === 'error') {
      logger.debug(this.oid + ' receiving error response...')
      // logger.debug({ to, from })
      const body = JSON.parse(stanza.getChild('error').text())
      this.msgEvents.emit(String(body.requestId), { error: body.errorMessage, status: body.statusCode })
      return 
    }
    // NORMAL CHAT MESSAGE
    if (type === 'chat') {
      const body: XMPPMessage = JSON.parse(stanza.getChild('body').text())
      const jid = this.rosterItemsOid.get(body.sourceOid)?.jid
      // Check if origin is in roster
      if (!jid) {
        logger.warn('Origin ' + body.sourceOid + ' is not in the roster of ' + this.oid + ' dropping message...')
        return
      }
      // Check if attrs.from and body.originId are the same!!! Otherwise tampering attempt error
      if (!from.includes(jid)) {
        logger.error('Tampering attempt sourceOid: ' + jid + ' differs from real origin ' + from + '!!')
        return
      }
      if (body.messageType === MessageType.REQUEST) {
        // If it is a request, respond to it with the same requestId
        logger.debug(this.oid + ' receiving remote message request...')
        try {
          const response = await this.processReq(body.requestOperation, { originOid: body.sourceOid, ...body.attributes, body: body.requestBody, ...body.parameters })
          await addRecord(body.requestOperation, body.requestId, body.sourceOid, body.destinationOid, JSON.stringify(body.requestBody), RecordStatusCode.MESSAGE_OK, false)
          await this.respondStanza(body.sourceOid, from, body.requestId, body.requestOperation, response, {}, {})
        } catch (err: unknown) {
          const error = errorHandler(err)
          logger.error('Returning network message with error... ' + error.message)
          await this.respondStanzaWithError(body.sourceOid, from, body.requestId, body.requestOperation, error.message, error.status)
        }
      } else if (body.messageType === MessageType.RESPONSE) {
        // If it is a response, emit event with requestId to close the HTTP connection
        logger.debug(this.oid + ' receiving message response...')
        this.msgEvents.emit(String(body.requestId), body.responseBody)
      } else if (body.messageType === MessageType.EVENT) {
        await addRecord(body.requestOperation, body.requestId, body.sourceOid, body.destinationOid, JSON.stringify(body.requestBody), RecordStatusCode.MESSAGE_OK, false)
        await this.processEvents(body)
      } else {
        // If it is a response, emit event with requestId to close the HTTP connection
        logger.error('Unknown XMPP message type received...')
        throw new MyError('Unknown XMPP message type received...', HttpStatusCode.BAD_REQUEST)
      }
      return
    } 
    // UNKNOWN Message type
    logger.debug('Gateway received unknown message type: ' + type)
  }

  // Request handlers

  private async processReq(key: RequestOperation, options: Options) {
    switch (key) {
      case RequestOperation.GETPROPERTYVALUE:
        return (await agent.getProperty(options.originOid, options.pid, this.oid)).message
      case RequestOperation.SETPROPERTYVALUE:
        return (await agent.putProperty(options.originOid, options.pid, this.oid, options.body!)).message
      case RequestOperation.SUBSCRIBETOEVENTCHANNEL:
        return this.processChannelSubscription(options as SubscribeChannelOpt)
      case RequestOperation.UNSUBSCRIBEFROMEVENTCHANNEL:
        return this.processChannelUnsubscription(options as SubscribeChannelOpt)
      case RequestOperation.GETEVENTCHANNELSTATUS:
        return this.processChannelStatus(options as SubscribeChannelOpt)
      case RequestOperation.GETTHINGDESCRIPTION:
        return this.getSemanticInfo(options)
      case RequestOperation.SENDNOTIFICATION:
          return this.processNotification(options as NotificationOpt)
      default:
        return null
    }
  }

  private async processNotification(options: NotificationOpt) {
    try {
      await agent.notify(Config.GATEWAY.ID, options.originOid, options.body ? options.body : {})
      // Notification -> reload all rosters
      // TODO check if it is needed? (base on notif type)
      await reloadAllRosters()
    } catch (err) {
      const error = errorHandler(err)
      logger.warn('Notification error: ' +  error.message)
    }
    return ({ message: 'Notification sent' })
}

  private processChannelSubscription(options: SubscribeChannelOpt) {
      const response = events.addSubscriber(this.oid, options.eid, options.originOid)
      if (!response.success) {
        throw new MyError('Object not found', HttpStatusCode.BAD_REQUEST)
      }
      return ({ ...response.body })
  }

  private processChannelUnsubscription(options: SubscribeChannelOpt) {
    const response = events.removeSubscriber(this.oid, options.eid, options.originOid)
    if (!response.success) {
      throw new MyError('Object not found', HttpStatusCode.BAD_REQUEST)
    }
    return ({ ...response.body })
  }

  private processChannelStatus(options: SubscribeChannelOpt) {
    const response =  events.channelStatus(this.oid, options.eid, options.originOid)
    if (!response.success) {
      throw new MyError('Object not found', HttpStatusCode.BAD_REQUEST)
    }
    return ({ ...response.body })
  }

  private async getSemanticInfo(options: Options) {
    const response = await agent.discovery(this.oid, options.originOid, options.body ? options.body : undefined)
    if (response.error) {
      throw new MyError(response.error)
    }
    return response.message
  }

  private async processEvents(body: XMPPMessage) {
    // Event --> @TBD check if ACK required, if no ACK you dont need to respond
    try {
      await agent.putEvent(body.sourceOid, body.parameters.eid, body.requestBody!)
    } catch (err: unknown) {
      const error = errorHandler(err)
      logger.error('Returning network message with error... ' + error.message)
      // await this.respondStanzaWithError(body.sourceOid, from, body.requestId, body.requestOperation, error.message, error.status)
    }
  }

}
