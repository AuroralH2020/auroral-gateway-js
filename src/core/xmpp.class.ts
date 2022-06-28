import { client, xml } from '@xmpp/client'
import EventEmmiter from 'node:events'
import crypto from 'crypto'
import { XMPPMessage, RosterItem, RequestOperation, MessageType, Options } from '../types/xmpp-types'
import { HttpStatusCode, logger, errorHandler, MyError  } from '../utils'
import { Config  } from '../config'
import { EventHandler } from './event.class'

export class XMPP {
  
  // Class variables
  
  readonly oid: string
  private rosterItemsOid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterItemsJid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterReloadTimer: NodeJS.Timer | undefined = undefined
  private msgTimeouts: Map<number, NodeJS.Timeout> = new Map<number,  NodeJS.Timeout>() // Timers to timeout requests
  private msgEvents: EventEmmiter = new EventEmmiter() // Handles events inside this class
  private eventChannels: Map<string, EventHandler> = new Map<string, EventHandler>()
  public client

  public constructor (oid: string, password: string) {
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

  public async start () {
    this.client.start({}).catch(
      (err: unknown) => {
          const error = errorHandler(err)
          logger.error('XMPP connection for oid ' + this.oid + ' could not be established')
          logger.error(error.message)
    })
  }

  public async stop (): Promise<void> {
      try {
          await this.client.send(xml('presence', { type: 'unavailable' }))
          await this.client.stop()
      } catch (err: unknown) {
          const error = errorHandler(err)
          logger.error(this.oid + 'disconnection error: ' + error.message)
      }
  }

  public async sendStanza (destinationOid: string, body: string | null, requestOperation: RequestOperation, messageType: MessageType, callback: (err: boolean, message: string) => void) {
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
      const payload: XMPPMessage = { messageType, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: body, responseBody: null, parameters: {}, attributes: {} }
  
      // Build XML and send message
      const message = xml(
        'message',
        { type: 'chat', to: jid },
        xml('body', {}, JSON.stringify(payload)),
      )
      await this.client.send(message)
      logger.debug('Message sent by ' + this.oid + ' through XMPP network... Destination ' + destinationOid)

      // Waiting for event response or timeout
      const timeout  = setTimeout(
        (error, message) => {
          this.msgEvents.removeAllListeners(String(requestId))
          callback(error, message)
        }, Number(Config.NM.TIMEOUT), true, 'Timeout awaiting response (10s)', callback
      )
      this.msgTimeouts.set(requestId, timeout) // Add to timeout list
      this.msgEvents.on(String(requestId), (data) => {
        // Cancel timeout
        const timeoutToCancel = this.msgTimeouts.get(requestId)
        clearTimeout(timeoutToCancel)
        this.msgTimeouts.delete(requestId)
        // Remove listener
        this.msgEvents.removeAllListeners(String(requestId))
        // Return response
        callback(false, data)
      })
  }

  // Return object roster
  public async getRoster () {
    const roster: string[] = []
    this.rosterItemsOid.forEach(it => {
      roster.push(it.name)
      // logger.debug(it)
    })
    return roster
  }

  // @TBD improve this function by calculating the difference and adding/removing items based on that
  // This way we do not remove from roster any items that should be there for any amount of time
  public async reloadRoster () {
    logger.info('Reloading roster of oid ' +  this.oid + '...')
    const roster = await this.client.iqCaller.get(xml('query', 'jabber:iq:roster'))
    const rosterItems = roster.getChildren('item',  'jabber:iq:roster')
    this.rosterItemsOid.clear()
    this.rosterItemsJid.clear()
    for (let i = 0, l = rosterItems.length; i < l; i++) {
        this.rosterItemsJid.set(rosterItems[i].attrs.jid, rosterItems[i].attrs)
        this.rosterItemsOid.set(rosterItems[i].attrs.name, rosterItems[i].attrs)
    }
  }

  // Events

  public addEventChannel (eid: string) {
    if (this.eventChannels.has(eid)) {
      logger.warn('Event channel already exists for oid ' + this.oid + ' and eid ' + eid)
    } else {
      logger.info('Creating event channel ' + this.oid + ':' + eid)
      this.eventChannels.set(eid, new EventHandler(this.oid, eid))
    }
  }

  public removeEventChannel (eid: string) {
    if (this.eventChannels.has(eid)) {
      logger.info('Removing event channel with oid ' + this.oid + ' and eid ' + eid)
      this.eventChannels.delete(eid)
    } else {
      logger.warn('Event channel ' + this.oid + ':' + eid + ' does not exist')
    }
  }

  /**
   * Get one event channel handler class specified by eid
   */
  public getEventChannel (eid: string) {
      const eventHandler = this.eventChannels.get(eid)
      if (eventHandler) {
        return eventHandler
      } else {
        throw new MyError('Event channel ' + this.oid + ':' + eid + ' does not exist', HttpStatusCode.NOT_FOUND)
      }
  }

  /**
   * Get all event channels list or only one class specified by eid
   * Returns the values (EventHandler objects) or the keys (EID names)
   * If values is true === EventHandlers
   */
     public getAllEventChannels (values: boolean = true) {
      if (values) {
        return Array.from(this.eventChannels.values())
      } else {
        return Array.from(this.eventChannels.keys())
      }
    }

  // Private methods

  private createClient (oid: string, password: string) {
    return client({
      service: Config.XMPP.SERVICE,
      domain: Config.XMPP.DOMAIN,
      resource: Config.XMPP.RESOURCE,
      username: oid,
      password
    })
  }

  private async respondStanza (destinationOid: string, jid: string, requestId: number, requestOperation: number, body: string) {
        const payload: XMPPMessage = { messageType: 2, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: null, responseBody: body, parameters: {}, attributes: {} }
        const message = xml(
          'message',
          { type: 'chat', to: jid },
          xml('body', {}, JSON.stringify(payload)),
        )
        await this.client.send(message)
  }

  // private async respondStanzaWithError (destinationOid: string, jid: string, requestId: number, requestOperation: number, body: string) {
  //   const payload: XMPPMessage = { messageType: 2, requestId, requestOperation, sourceAgid: Config.GATEWAY.ID, sourceOid: this.oid, destinationOid, requestBody: null, responseBody: body, parameters: {}, attributes: {} }
  //   const message = xml(
  //     'error',
  //     { type: 'chat', to: jid },
  //     xml('error', {}, JSON.stringify(payload)),
  //   )
  //   await this.client.send(message)
  // }

  // Event handlers

  private onError (err: unknown) {
    const error = errorHandler(err)
    logger.error(error.message)
  }

  private onOffline () {
    logger.info('XMPP client with oid ' + this.oid + ' disconnected')
    clearInterval(this.rosterReloadTimer)
  }

  private async onStanza (stanza: any) {
    if (stanza.is('message')) {
      const { to, from, type } =  stanza.attrs as { to: string, from: string, type: string}
      if (type === 'error') {
          logger.debug(this.oid + ' error message...')
          logger.debug({ to, from })
          logger.debug(stanza.getChild('body').text())
          logger.debug(stanza.getChild('error').text())
      } else if (type === 'chat') {
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
          if (body.messageType === 1) {
            // If it is a request, respond to it with the same requestId
            logger.debug(this.oid + ' receiving message request...')
            // USE handleRequest to do sth based on requestOperation
            await this.respondStanza(body.sourceOid, from, body.requestId, body.requestOperation, 'Custom response')
          } else if (body.messageType === 2) {
            // If it is a response, emit event with requestId to close the HTTP connection
            logger.debug(this.oid + ' receiving message response...')
            this.msgEvents.emit(String(body.requestId), body.responseBody)
          } else if (body.messageType === 3) {
            // Event --> @TBD check if ACK required, if no ACK you dont need to respond
          } else {
            // If it is a response, emit event with requestId to close the HTTP connection
            logger.error('Unknown XMPP message type received...')
            throw new MyError('Unknown XMPP message type received...', HttpStatusCode.BAD_REQUEST)
          }
      } else {
          logger.debug('Gateway received unknown message type: ' + type)
      }
    } else {
      // I.e. presence, ...
      // logger.debug('Stanza received: Not message type')
      // logger.debug(stanza.toString())
    }  
  }

  private handleRequest (key: RequestOperation, options: Options) {
    switch (key) {
      case RequestOperation.GETPROPERTYVALUE:
        // Retrieve value and return
        break
      case RequestOperation.SUBSCRIBETOEVENTCHANNEL:
          // Retrieve value and return
          break
      default:
        break
    }
  }

  private onOnline () {
    logger.info('XMPP client with oid ' + this.oid + ' was logged in!')
    // Makes itself available
    this.client.send(xml('presence'))
    // Reload roster
    this.reloadRoster()
    this.rosterReloadTimer = setInterval(() => {
        this.reloadRoster()
    }, Number(Config.XMPP.ROSTER_REFRESH)) // 10 min
  }
}
