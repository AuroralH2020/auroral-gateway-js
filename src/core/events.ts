import path from 'path'
import fs from 'fs'
import { HttpStatusCode , logger , MyError } from '../utils'
import { Config } from '../config'
import { clients } from './xmpp'
import { EventHandler } from './event.class'
import { JsonType } from '../types/misc-types'
import { agent } from '../connectors/agent-connector'

// Types
interface localResponse {
    success: boolean,
    body: JsonType
}

// ONLY LOCAL

/**
 * Creates event channel for the given oid + eid
 * If it already exists, does nothing
 * @param oid - object id
 * @param eid - event id
 */
export function createEventChannel(oid: string, eid: string): void {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        xmppClient.addEventChannel(eid)
    } else {
        throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
    }
}

/**
 *  Removes event channel for the given oid + eid
 *  If it does not exist, does nothing
 * @param oid - object id
 * @param eid - event id
 */
export function removeEventChannel(oid: string, eid: string): void {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        xmppClient.removeEventChannel(eid)
    } else {
        throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
    }
}

/**
 * Retrieve all EIDs of a given OID
 * @param oid 
 * @returns 
 */
export function getEventChannelsNames(oid: string): string[] {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        return xmppClient.getAllEventChannels(false) as string[]
    } else {
        throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
    }
}

/**
 * Loads event channels settings from file
 */
 export function storeEventChannels() {
    logger.debug('Storing event channels')
    let eventChannels: EventHandler[] = []
    const oids = Array.from(clients.keys())
    for (let i = 0, l = oids.length; i < l; i++) {
        const xmppClient = clients.get(oids[i])
        if (xmppClient) {
            eventChannels = eventChannels.concat(Array.from(xmppClient.getAllEventChannels() as EventHandler[]))
        }
    }
    const eventChannelsJson = JSON.stringify(eventChannels)
    try {
        fs.writeFileSync(path.join(path.join(Config.HOME_PATH, Config.EVENTS.SETTINGS_FILE)), eventChannelsJson)
    } catch (err) {
        logger.error('Error storing event channels: ' + err)
    }
}

/**
 * Store event channels settings to file
 */
export function loadEventChannels() {
    logger.debug('Loading event channels')
    try {
        const eventChannelsJson = fs.readFileSync(path.join(Config.HOME_PATH, Config.EVENTS.SETTINGS_FILE)).toString()
        if (eventChannelsJson) {
            const eventChannels = JSON.parse(eventChannelsJson)
            eventChannels.forEach((eventChannel: { oid: string, eid: string, _subscribers: Set<string> }) => {
                const xmppClient = clients.get(eventChannel.oid)
                if (xmppClient) {
                    xmppClient.addEventChannel(eventChannel.eid, eventChannel)
                }
            })
        }
    } catch (error) {
        logger.error('Error loading event channels: ' + error)
    }
}

/**
 *  Returns array of subscribers for the given oid + eid
 * @param oid - object id
 * @param eid - event id
 * @returns 
 */
 export function getSubscribers(oid: string, eid: string) {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        const eventHandler = xmppClient.getEventChannel(eid)
        return eventHandler.subscribers
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
export function addSubscriber(oid: string, eid: string, subscriberOid: string): localResponse {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        const eventHandler = xmppClient.getEventChannel(eid)
        eventHandler.addSubscriber(subscriberOid)
        logger.info('Added subscriber ' + subscriberOid + ' to event channel ' + oid + ':' + eid)
        return { success: true, body: {} }
    } else {
        // send message to network
        logger.info('Destination OID ' + oid + ' not found... Sending request over network')
        return { success: false, body: {} }
    }
}

/**
 * Removes subscriber from the event channel for the given oid + eid
 * If it does not exist, throws error
 * @param oid - object id
 * @param eid - event id
 * @param subscriberOid - subscriber object id
 */
export function removeSubscriber(oid: string, eid: string, subscriberOid: string) {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        const eventHandler = xmppClient.getEventChannel(eid)
        eventHandler.removeSubscriber(subscriberOid)
        logger.info('Removed subscriber ' + subscriberOid + ' to event channel ' + oid + ':' + eid)
        return { success: true, body: {} }
    } else {
        // send message to network
        logger.info('Destination OID ' + oid + ' not found... Sending request over network')
        return { success: false, body: {} }
    }
}

export function channelStatus(oid: string, eid: string, sourceOid: string): localResponse {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        const eventHandler = xmppClient.getEventChannel(eid)
        return { success: true, body: { message: 'Channel is opened, there are ' + eventHandler.subscribers.size + ' subscribers' } }
    } else {
        // send message to network
        logger.info('Destination OID ' + oid + ' not found... Sending request over network')
        return { success: false, body: {} }
    }
}

export function sendEvent(oid: string, eid: string, body: JsonType): localResponse {
    const xmppClient = clients.get(oid)
    if (xmppClient) {
        agent.putEvent(oid, eid, body)
        return { success: true, body: {} }
    } else {
        // send message to network
        logger.info('Destination OID ' + oid + ' not found...')
        return { success: false, body: {} }
    }
}

// /**
//  * Send event to all subscribers of the event channel for the given oid + eid
//  * @param oid - object id
//  * @param eid - event id
//  * @param message - message to be sent to subscribers
//  */
// export async function sendEvent(oid: string, eid: string, bodyMessage: string) {
//     if (eventHandlers.has(oid + eid)) {
//         const eventHandler = eventHandlers.get(oid + eid)!
//         logger.debug('Sending event  to event channel ' + oid + ':' + eid)
//         for (const subscriberOid of eventHandler.getSubscribers()) {
//             logger.debug('TODO: Sending event to subscriber ' + subscriberOid)
//             // TODO: Send event to subscribers
//         }
//     } else {
//         logger.warn('Event channel not found')
//     }
// }
