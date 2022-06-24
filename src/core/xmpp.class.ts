import { client, xml } from '@xmpp/client'
import EventEmmiter from 'node:events'
import crypto from 'crypto'
import { errorHandler } from '../utils/error-handler'
import { logger } from '../utils'
import { Config  } from '../config'
import { JsonType } from '../types/misc-types'

// Class custom types

type RosterItem = {
  jid: string,
  name: string,
  subscription: string
}

type Message = {
  messageType: number,
  requestOperation: number, // Needed??
  isRequest: number, // 1 = isReq, 0 = isNotReq
  requestId: string, // ID of the message
  sourceAgid: string,
  sourceOid: string,
  destinationOid: string,
  requestBody: string | null,
  attributes: JsonType,
  parameters: JsonType
}

export class XMPP {
  
  // Class variables
  
  readonly oid: string
  private rosterItemsOid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterItemsJid: Map<string, RosterItem> = new Map<string, RosterItem>()
  private rosterReloadTimer: NodeJS.Timer | undefined = undefined
  private msgTimeouts: Map<string, NodeJS.Timeout> = new Map<string,  NodeJS.Timeout>() // Timers to timeout requests
  private msgEvents: EventEmmiter = new EventEmmiter() // Handles events inside this class
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

  public async sendStanza (destinationOid: string, body: string | null, callback: (err: boolean, message: string) => void) {
      // Check if destination is in roster
      // Works in AURORAL, update for federated scenario!!! Same OID under different domain would be possible
      const jid = this.rosterItemsOid.get(destinationOid)?.jid
      if (!jid) {
        logger.warn('Destination ' + destinationOid + ' is not in the roster of ' + this.oid)
        return
      }

      // Add random ID to the request
      const requestId = crypto.randomUUID()

      // Create message payload
      const payload: Message = { messageType: 1, requestId, requestOperation: 1, sourceAgid: 'dummy', sourceOid: this.oid, destinationOid, requestBody: body, isRequest: 1, parameters: {}, attributes: {} }
  
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
          this.msgEvents.removeAllListeners(requestId)
          callback(error, message)
        }, Number(Config.NM.TIMEOUT), true, 'Timeout awaiting response (10s)', callback
      )
      this.msgTimeouts.set(requestId, timeout) // Add to timeout list
      this.msgEvents.on(requestId, (data) => {
        // Cancel timeout
        const timeoutToCancel = this.msgTimeouts.get(requestId)
        clearTimeout(timeoutToCancel)
        this.msgTimeouts.delete(requestId)
        // Remove listener
        this.msgEvents.removeAllListeners(requestId)
        // Return response
        callback(false, data)
      })
  }

  // Return object roster
  public async getRoster () {
    this.rosterItemsOid.forEach(it => {
      logger.debug(it)
    })
    return this.rosterItemsOid
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

  private async respondStanza (destinationOid: string, jid: string, requestId: string, body: string) {
        const payload: Message = { messageType: 1, requestId, requestOperation: 1, sourceAgid: 'dummy', sourceOid: this.oid, destinationOid, requestBody: body, isRequest: 0, parameters: {}, attributes: {} }
    
        const message = xml(
          'message',
          { type: 'chat', to: jid },
          xml('body', {}, JSON.stringify(payload)),
        )
        await this.client.send(message)
  }

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
          const body: Message = JSON.parse(stanza.getChild('body').text())
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
          if (body.isRequest === 1) {
            // If it is a request, respond to it with the same requestId
            logger.debug(this.oid + ' receiving message request...')
            await this.respondStanza(body.sourceOid, from, body.requestId, 'Custom response')
          } else {
            // If it is a response, emit event with requestId to close the HTTP connection
            logger.debug(this.oid + ' receiving message response...')
            this.msgEvents.emit(body.requestId, body.requestBody)
          }
      } else {
          logger.debug('Gateway received unknown message type: ' + type)
      }
    } else {
      // logger.debug('Stanza received: Not message type')
      // logger.debug(stanza.toString())
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
