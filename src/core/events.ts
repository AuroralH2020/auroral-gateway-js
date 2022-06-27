import path from 'path'
import fs from 'fs'
import { HttpStatusCode , logger , MyError } from '../utils'
import { EventHandler } from './event.class'
import { sendMessage } from './xmpp'
import { Config } from '../config'

const eventHandlers: Map<string, EventHandler> = new Map<string, EventHandler>()

/**
 * Creates event channel for the given oid + eid
 * If it already exists, does nothing
 * @param oid - object id
 * @param eid - event id
 */
export function createEventChannel(oid: string, eid: string): void {
    if (!eventHandlers.has(oid + eid)) {
        logger.debug('Creating event channel ' + oid + ':' + eid)
        eventHandlers.set(oid + eid, new EventHandler(oid, eid))
    } else {
        logger.warn('Event channel already exists for oid ' + oid + ' and eid ' + eid)
    }
}

/**
 *  Removes event channel for the given oid + eid
 *  If it does not exist, does nothing
 * @param oid - object id
 * @param eid - event id
 */
export function removeEventChannel(oid: string, eid: string): void {
    if (eventHandlers.has(oid + eid)) {
        logger.debug('Removing event channel ' + oid + ':' + eid)
        eventHandlers.delete(oid + eid)
    } else {
        logger.warn('Event channel does not exist for oid ' + oid + ' and eid ' + eid)
    }
}

/**
 * Adds subscriber to the event channel for the given oid + eid
 * If it does not exist, throws error
 * @param oid - object id
 * @param eid - event id
 * @param subscriberOid - subscriber object id
 */
export function addSubscriber(oid: string, eid: string, subscriberOid: string) {
    if (eventHandlers.has(oid + eid)) {
        const eventHandler = eventHandlers.get(oid + eid)!
        logger.debug('Adding subscriber ' + subscriberOid + ' to event channel ' + oid + ':' + eid)
        eventHandler.addSubscriber(subscriberOid)
    } else {
        throw new MyError('Event channel not found', HttpStatusCode.NOT_FOUND)
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
    if (eventHandlers.has(oid + eid)) {
        const eventHandler = eventHandlers.get(oid + eid)!
        logger.debug('Removing subscriber ' + subscriberOid + ' from event channel ' + oid + ':' + eid)
        eventHandler.removeSubscriber(subscriberOid)
    } else {
        throw new MyError('Event channel not found', HttpStatusCode.NOT_FOUND)
    }
}

/**
 * Send event to all subscribers of the event channel for the given oid + eid
 * @param oid - object id
 * @param eid - event id
 * @param message - message to be sent to subscribers
 */
export async function sendEvent(oid: string, eid: string, message: string) {
    if (eventHandlers.has(oid + eid)) {
        const eventHandler = eventHandlers.get(oid + eid)!
        logger.debug('Sending event ' + message + ' to event channel ' + oid + ':' + eid)
        for (const subscriberOid of eventHandler.getSubscribers()) {
            logger.debug('TODO: Sending event ' + message + ' to subscriber ' + subscriberOid)
            // TODO: Send event to subscribers
        }
    } else {
        logger.warn('Event channel not found')
    }
}
/**
 * Loads event channels settings from file
 */
export function storeEventChannels() {
    logger.debug('Storing event channels')
    const eventChannels = Array.from(eventHandlers.values())
    const eventChannelsJson = JSON.stringify(eventChannels)
    logger.debug('Storing event channels: ' + eventChannelsJson)
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
            eventChannels.forEach((eventChannel: EventHandler) => {
                eventHandlers.set(eventChannel.oid + eventChannel.eid, eventChannel)
            })
        }
    } catch (error) {
        logger.error('Error loading event channels: ' + error)
    }
}
