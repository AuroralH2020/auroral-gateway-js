import path from 'path'
import fs from 'fs'
import { errorHandler, HttpStatusCode , logger , MyError } from '../utils'
import { Config } from '../config'
import { clients } from './xmpp'
import { EventHandler } from './event.class'
import { JsonType } from '../types/misc-types'
import { agent } from '../connectors/agent-connector'

// Types
interface LocalResponse {
    success: boolean,
    body: JsonType
}
class Events {
    private static instance: Events
    private eventChannels: Map<string, Map<string, EventHandler>> = new Map()
    public static getInstance(): Events {
        if (!Events.instance) {
            Events.instance = new Events()
        }
        return Events.instance
    }
    /**
     * Creates event channel for the given oid + eid
     * If it already exists, does nothing
     * @param oid - object id
     * @param eid - event id
     */
    public createEventChannel(oid: string, eid: string): void {
        logger.debug('Creating event channel ' + oid + ':' + eid)
        const xmppClient = clients.get(oid)
        if (!xmppClient) {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND)
        }
        const eventChannel =  this.eventChannels.get(oid)
        if (!eventChannel) {
            const newEventChannel: Map<string,EventHandler> = new Map()
            newEventChannel.set(eid, new EventHandler(oid, eid))
            this.eventChannels.set(oid, newEventChannel)
        } else {
            this.eventChannels.set(oid, new Map<string, EventHandler>().set(eid, new EventHandler(oid, eid)))
        }
    }
    /**
     *  Removes event channel for the given oid + eid
     *  If it does not exist, does nothing
     * @param oid - object id
     * @param eid - event id
     */
    public removeEventChannel(oid: string, eid: string): void {
        logger.debug('Removing event channel ' + oid + ':' + eid)
        if (!clients.has(oid)) {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND)
        }
        const eventChannel =  this.eventChannels.get(oid)
        if (eventChannel) {
            eventChannel.delete(eid)
            this.eventChannels.set(oid, eventChannel)
        } else {
            logger.warn('Event channel ' + oid + ':' + eid + ' does not exist')
        }
    }
    /**
     * Retrieve all EIDs of a given OID
     * @param oid 
     * @returns 
     */
    public getEventChannelsNames(oid: string): {success: boolean, body: string[] } {
        logger.debug('Retrieving event channels names for ' + oid)
        if (!clients.has(oid)) {
            return { success: false, body: [] }
            // throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND)
        }
        const eventChannel =  this.eventChannels.get(oid)
        if (eventChannel) {
            const eventList = Array.from(eventChannel.keys())
            console.log(eventList)
            return { success: true, body: eventList }
        } else {
            return { success: true, body: [] }
        }
    }
    /**
     *  Returns array of subscribers for the given oid + eid
     * @param oid - object id
     * @param eid - event id
     * @returns 
     */
    public getSubscribers(oid: string, eid: string): string[] {
        logger.debug('Retrieving subscribers for ' + oid + ':' + eid)
        if (!clients.has(oid)) {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND)
        }
        const eventChannel =  this.eventChannels.get(oid)
        if (eventChannel && eventChannel.get(eid) !== undefined) {
            return Array.from(eventChannel.get(eid)!.subscribers)
        } else {
            return []
        }
    }
    /**
     * Adds subscriber to the event channel for the given oid + eid
     * If it does not exist, throws error
     * @param oid - object id
     * @param eid - event id
     * @param subscriberOid - subscriber object id
     */
    public addSubscriber(oid: string, eid: string, subscriberOid: string): LocalResponse {
        logger.debug('Adding subscriber ' + subscriberOid + ' to ' + oid + ':' + eid)
        if (!clients.has(oid)) {
            return { success: false, body: {} }
        }
        const eventChannel =  this.eventChannels.get(oid)
        if (eventChannel) {
            if (!eventChannel.has(eid)) {
                throw new MyError('Event channel ' + oid + ':' + eid + ' does not exist', HttpStatusCode.NOT_FOUND)
            }
            const eventHandler = eventChannel.get(eid)
            eventHandler?.addSubscriber(subscriberOid)
            return { success: true, body: { message: 'Object ' + subscriberOid + ' subscribed channel ' + eid + ' of object ' + oid } }
        } else {
            throw new MyError('Event channel ' + oid + ':' + eid + ' does not exist', HttpStatusCode.NOT_FOUND)
        }
    }
    /**
     * Removes subscriber from the event channel for the given oid + eid
     * If it does not exist, throws error
     * @param oid - object id
     * @param eid - event id
     * @param subscriberOid - subscriber object id
     */
    public removeSubscriber(oid: string, eid: string, subscriberOid: string) {
        logger.debug('Removing subscriber ' + subscriberOid + ' from ' + oid + ':' + eid)
        if (!clients.has(oid)) {
            return { success: false, body: {} }
        }
        const eventChannel =  this.eventChannels.get(oid)
        if (eventChannel) {
            if (!eventChannel.has(eid)) {
                throw new MyError('Event channel ' + oid + ':' + eid + ' does not exist', HttpStatusCode.NOT_FOUND)
            }
            const eventHandler =  eventChannel.get(eid)
            eventHandler?.removeSubscriber(subscriberOid)
            return { success: true, body: { message: 'Object ' + subscriberOid + ' unsubscribed channel ' + eid + ' of remote object ' + oid } }
        } else {
            throw new MyError('Event channel ' + oid + ':' + eid + ' does not exist', HttpStatusCode.NOT_FOUND)
        }
    }

    public channelStatus(oid: string, eid: string, _sourceOid: string): LocalResponse {
        logger.debug('Retrieving channel status for ' + oid + ':' + eid)
        if (clients.has(oid)) {
            const eventChannel =  this.eventChannels.get(oid)
            if (eventChannel) {
                if (eventChannel.has(eid)) {
                    const eventHandler =  eventChannel.get(eid)
                    if (eventHandler) {
                        return { success: true, body: { message: 'Channel is opened, there are ' + eventHandler.subscribers.size + ' subscribers' } }
                    }
                }
            }
            return { success: false, body: { message: 'Channel is not opened' } }
        } else {
            // send message to network
            logger.info('Destination OID ' + oid + ' not found... Sending request over network')
            return { success: false, body: {} }
        }
    }

    public sendEvent(sourceoid: string, oid: string, eid: string, body: JsonType): LocalResponse {
        logger.debug('Sending event ' + eid + ' / ' + oid)
        if (clients.has(oid)) {
            agent.putEvent(sourceoid, oid, eid, body)
            return { success: true, body: {} }
        } else {
            // send message to network
            logger.info('Destination OID ' + oid + ' not found...')
            return { success: false, body: {} }
        }
    }

    /**
     * Store event channels settings to file
     */
    public storeEventChannelsToFile() {
        const array = []
        for (const [oid, eventChannel] of this.eventChannels) {
            const oidArray = []
            for (const [eid, eventHandler] of eventChannel) {
                oidArray.push({ eid: eid, subscribers: Array.from(eventHandler.subscribers) })
            }
            array.push({ oid, eventChannels: oidArray })
        }
        const eventChannelsJsonString = JSON.stringify(array)
        fs.writeFileSync(path.join(path.join(Config.HOME_PATH, Config.EVENTS.SETTINGS_FILE)), eventChannelsJsonString) 
    }

    /**
     * Loads event channels settings from file
     */
    public loadEventChannelsFromFile() {
        try {
            const eventChannelsJsonString = fs.readFileSync(path.join(path.join(Config.HOME_PATH, Config.EVENTS.SETTINGS_FILE)), 'utf8')
            const eventChannels = JSON.parse(eventChannelsJsonString)
            for (const eventChannel of eventChannels) {
                const oid = eventChannel.oid as string
                const oidEvenChannels = eventChannel.eventChannels as { eid: string, subscribers: string[]}[]
                const secondLevelMap: Map <string, EventHandler> = new Map() 
                for (const event of oidEvenChannels) {
                    const eid = event.eid 
                    const subscribers = event.subscribers 
                    secondLevelMap.set(eid, new EventHandler(oid, eid, subscribers))
                }
                this.eventChannels.set(oid, secondLevelMap)
            }
        } catch (err) {
            const error = errorHandler(err)
            logger.error('Problem loading event channels from file: ' + error.message)
        }
    }
}

export const events = Events.getInstance()
