import { client, xml, jid as jidNs } from '@xmpp/client'
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
import { signMessage, validateMessage } from './encryption'

export class XMPP {

  // Class variables

  readonly oid: string
  private rosterItemsOid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterItemsJid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterReloadTimer: NodeJS.Timer | undefined = undefined
  private msgTimeouts: Map<number, NodeJS.Timeout> = new Map<number, NodeJS.Timeout>() // Timers to timeout requests
  private msgEvents: EventEmmiter = new EventEmmiter() // Handles events inside this class
  private blacklistedSenders: Set<string> = new Set<string>() // Blacklisted senders - removed on roster reload
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
    this.client.start().catch(
      (err: unknown) => {
        const error = errorHandler(err)
        // TODO consider test if not offline before running start()
        if (error.message !== 'Connection is not offline') {
          if (error.message === 'not-authorized') {
            logger.warn('Please double check that you password is correct?')
          }
          console.log(err)
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
      const jid = await this.verifyReceiver(destinationOid)
      if (!jid) {
        logger.warn('Destination ' + destinationOid + ' is not in the roster of ' + this.oid + ' or it is offline')
        throw new MyError('Destination OID not found in roster or it is offline, aborting message', HttpStatusCode.NOT_FOUND)
      }

      // Add random ID to the request
      const requestId = crypto.randomBytes(4).readUInt32BE()

      // Create message payload
      const payload: XMPPMessage = { messageType, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: body, responseBody: null, parameters, attributes }

      // Build XML and send message
      const message = xml(
        'message',
        { type: 'chat', to: jid },
        xml('body', {}, JSON.stringify(payload))
      )
      message.append(xml('signature', {}, await signMessage(JSON.stringify(payload))))
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
          async (error: boolean, message2: JsonType<any>) => {
            this.msgEvents.removeAllListeners(String(requestId))
            await addRecord(requestOperation, requestId, this.oid, destinationOid, '', RecordStatusCode.RESPONSE_NOT_RECEIVED, true)
            callback(error, message2)
          }, Number(Config.NM.TIMEOUT), true, { error: 'Timeout awaiting response (' + Config.NM.TIMEOUT + ')', status: HttpStatusCode.REQUEST_TIMEOUT }, callback
        )  as unknown as NodeJS.Timeout
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
      callback(true, error)
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
  // parameter for removing blacklist - default true
  public async reloadRoster(cleanBlacklist = true) {
    logger.info('Reloading roster of oid ' + this.oid + '...')
    const roster = await this.client.iqCaller.get(xml('query', 'jabber:iq:roster'))
    if (!roster) {
      logger.error('Error reloading roster of oid ' + this.oid + '...')
      return
    }
    const rosterItems = roster.getChildren('item', 'jabber:iq:roster')
    if (cleanBlacklist) {
      this.blacklistedSenders.clear()
    }
    this.rosterItemsOid.clear()
    this.rosterItemsJid.clear()
    for (let i = 0, l = rosterItems.length; i < l; i++) {
      this.rosterItemsJid.set(rosterItems[i].attrs.jid, rosterItems[i].attrs as RosterItem)
      const userName = jidNs.jid(rosterItems[i].attrs.jid).getLocal() // Fix because 'username' is not always the same as 'name'
      this.rosterItemsOid.set(userName, rosterItems[i].attrs as RosterItem)
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

  private async respondStanza(destinationOid: string, jid: string, requestId: number, requestOperation: RequestOperation, body: JsonType | null, _attributes: JsonType, _parameters: JsonType) {
    const payload: XMPPMessage = { messageType: 2, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: null, responseBody: body, parameters: {}, attributes: {} }
    const message = xml(
      'message',
      { type: 'chat', to: jid },
      xml('body', {}, JSON.stringify(payload))
    )
    message.append(xml('signature', {}, await signMessage(JSON.stringify(payload))))

    await this.client.send(message)
  }

  private async respondStanzaWithError(destinationOid: string, jid: string, requestId: number, requestOperation: RequestOperation, errorMessage: string, statusCode: number) {
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
    }, Number(Config.XMPP.ROSTER_REFRESH)) // every 3 min
  }

  private async onStanza(stanza: any) {
    const { _to, from, type } = stanza.attrs as { _to: string, from: string, type: string }
    // if (!stanza.is('message')) {
    //   // I.e. presence, ...
    //   if (type === 'result') {
    //     logger.debug('Stanza received: Not message type, type is: --> ' + type)
    //     console.debug(stanza.attrs.toString())
    //     return
    //   } else {
    //     logger.debug('Stanza received: Not message type, type is: --> ' + type)
    //     logger.debug(stanza.toString())
    //     return
    //   }
    // }
    // ERROR
    if (type === 'error') {
      logger.debug(this.oid + ' receiving error response...')
      try {
        const body = JSON.parse(stanza.getChild('error').text())
        this.msgEvents.emit(String(body.requestId), { error: body.errorMessage, status: body.statusCode })
        return 
      } catch (error) {
        //  Here are thrown errors if other gtw is offline. It is non our 'standard' error, so it doesn't have JSON body
        // We should handle this error in a better way -  but we need to know requestId
        try {
          if (stanza.getChild('error').attrs.code === '503') {
            const body = JSON.parse(stanza.getChild('body').text())
            logger.error('Remote gateway is offline')
            this.msgEvents.emit(String(body.requestId), { error: 'Destination not reachable', status: HttpStatusCode.SERVICE_UNAVAILABLE })
          }
        } catch (error) {
          logger.error('Non standard ERROR received')
        }
        return
      }
    }
    // NORMAL CHAT MESSAGE
    if (type === 'chat') {
      // Validate signature of message
      const oidFromJid =  jidNs.jid(from).getLocal()
      const body: XMPPMessage = this.fixCompatibility(JSON.parse(stanza.getChild('body').text()))
      
      // SIGNATURE test
      if (stanza.getChild('signature')) {
        const signature = stanza.getChild('signature').text() as string
        const validation =  await validateMessage(oidFromJid, stanza.getChild('body').text(), signature)
        logger.debug('Signature validation: ' + validation)
        if (!validation) {
          logger.error('Invalid signature')
          this.msgEvents.emit(String(body.requestId), { error: 'Invalid signature', status: HttpStatusCode.FORBIDDEN })
          return
        }
      } else {
        logger.warn('No signature found')
      }
      // check sender (tampering, is in roster,...)
      if (await this.verifySender(body.sourceOid, from)) {
        logger.debug('Valid sender')
      } else {
        logger.error('Invalid sender')
        this.msgEvents.emit(String(body.requestId), { error: 'You are not in roster of this object', status: HttpStatusCode.FORBIDDEN })
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
        await this.processEvents(this.oid, body)
        await addRecord(body.requestOperation, body.requestId, body.sourceOid, body.destinationOid, JSON.stringify(body.requestBody), RecordStatusCode.MESSAGE_OK, false)
      } else {
        // If it is a response, emit event with requestId to close the HTTP connection
        logger.error('Unknown XMPP message type received...')
        throw new MyError('Unknown XMPP message type received...', HttpStatusCode.BAD_REQUEST)
      }
      return
    } 
    // UNKNOWN Message type
    // logger.debug('Gateway received stanza message of unknown type: Not chat nor error')
    // logger.debug('FROM: ' + from)
    // console.log(stanza.toString())
    // console.log(stanza.attrs)
  }

  // check if sender is in roster + check tampering and relaods roster if needed
  public async verifySender(sourceOid: string, from: string): Promise<boolean> {
    // check if sender is in roster
    let jid = this.rosterItemsOid.get(sourceOid)?.jid
    // Platform notification - valid
    if (sourceOid.toLowerCase().includes(Config.XMPP.ENVIRONMENT)) {
      return true
    }
    if (!jid) {
      // if not in roster, reload roster and retry
      if (!this.blacklistedSenders.has(sourceOid)) {
        logger.warn('Origin ' + sourceOid + ' is not in the roster of ' + this.oid + ', reloading roster...')
        await this.reloadRoster(false)
        jid = this.rosterItemsOid.get(sourceOid)?.jid
        if (jid) {
          // If in roster return with tampering validation
          return this.isTampering(from, jid)
        } else {
          // If not in roster blacklist and reject
          this.blacklistedSenders.add(sourceOid)
          return false
        }
      } else {
        // Case it was already blacklisted
        logger.debug('Access attemp of blacklisted OID: ' + sourceOid)
        return false
      }
    } else {
      // If in roster return with tampering validation
      return this.isTampering(from, jid)
    }
  }

  // Check if destination is in roster
  public async verifyReceiver(destinationOid: string): Promise<string | undefined> {
      // Works in AURORAL, update for federated scenario!!! Same OID under different domain would be possible
      const jid = this.rosterItemsOid.get(destinationOid)?.jid
      if (!jid) {
          logger.debug('Destination ' + destinationOid + ' not in roster, refreshing roster...')
          await this.reloadRoster(false)
          return this.rosterItemsOid.get(destinationOid)?.jid
      } else {
        return jid
      }
  }

  private isTampering (from: string, jid?: string) {
    if (!jid || !from.includes(jid)) {
      logger.error('Tampering attempt sourceOid: ' + jid + ' differs from real origin ' + from + '!!')
      return false
    }
    return true
  }

  // Request handlers

  private async processReq(key: RequestOperation, options: Options) {
    switch (key) {
      case RequestOperation.GETPROPERTYVALUE:
        return (await agent.getProperty(options.originOid, options.pid, this.oid, options.reqParams)).message
      case RequestOperation.SETPROPERTYVALUE:
        return (await agent.putProperty(options.originOid, options.pid, this.oid, options.body!, options.reqParams)).message
      case RequestOperation.SUBSCRIBETOEVENTCHANNEL:
        return this.processChannelSubscription(options as SubscribeChannelOpt)
      case RequestOperation.UNSUBSCRIBEFROMEVENTCHANNEL:
        return this.processChannelUnsubscription(options as SubscribeChannelOpt)
      case RequestOperation.GETEVENTCHANNELSTATUS:
        return this.processChannelStatus(options as SubscribeChannelOpt)
        case RequestOperation.GETLISTOFEVENTS:
        return this.processEventList()
      case RequestOperation.GETTHINGDESCRIPTION:
        return this.getSemanticInfo(options)
      case RequestOperation.SENDNOTIFICATION:
          return this.processNotification(options as NotificationOpt)
      default:
        logger.warn('Unknown request operation: ' + key)
        return null
    }
  }

  private async processNotification(options: NotificationOpt) {
    try {
      logger.debug('Sending notification to agent')
      await agent.notify(options.originOid, Config.GATEWAY.ID, options.nid, options.body ? options.body : {})
      // Notification -> reload all rosters
      // Reloading all rosters is maybe not necessary
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

  private processEventList() {
    const response = events.getEventChannelsNames(this.oid)
    if (!response.success) {
      throw new MyError('Object not found', HttpStatusCode.BAD_REQUEST)
    }
    return (response.body!)
  }

  private async getSemanticInfo(options: Options) {
    const response = await agent.discovery(options.originOid, this.oid, options.body ? options.body : undefined)
    if (response.error) {
      throw new MyError(response.error)
    }
    return response.message
  }

  private async processEvents(oid: string, body: XMPPMessage) {
    // Event --> @TBD check if ACK required, if no ACK you dont need to respond
    try {
      logger.debug('Receiving event OID:' + oid + 'eid:' + body.parameters.eid)
      await agent.putEvent(body.sourceOid, oid, body.parameters.eid, body.requestBody!)
    } catch (err: unknown) {
      const error = errorHandler(err)
      logger.error('Returning network message with error... ' + error.message)
      // await this.respondStanzaWithError(body.sourceOid, from, body.requestId, body.requestOperation, error.message, error.status)
    }
  }
  // Function to fix requestOperations number -> string
  // only SENDNOTIFICATION is needed
  // Remove after changing xmppNotifSender in NM (agent 3.0)
  // In xmppNotifSender -> send string insteaf of number for reqOperation
  private fixCompatibility(body: XMPPMessage) {
    if (typeof (body.requestOperation as any) === 'number') {
     switch (body.requestOperation as any as number) {
        case 12:
          body.requestOperation = RequestOperation.SENDNOTIFICATION
          break
        default:
          body.requestOperation = RequestOperation.UNKNOWN
          break
     }
    }
    return body
  }

 }
