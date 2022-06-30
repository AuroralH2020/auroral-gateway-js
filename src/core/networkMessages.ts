import { HttpStatusCode , logger , MyError } from '../utils'
import { clients } from './xmpp'
import { JsonType } from '../types/misc-types'
import { MessageType, RequestOperation } from '../types/xmpp-types'

/**
 * Adds subscriber to the event channel for the given oid + eid
 * If it does not exist, throws error
 * @param oid - object id
 * @param eid - event id
 * @param subscriberOid - subscriber object id
 */
 export function addSubscriberNetwork(oid: string, eid: string, subscriberOid: string) {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(subscriberOid)
        if (xmppClient) {
            xmppClient.sendStanza(oid, null, RequestOperation.SUBSCRIBETOEVENTCHANNEL, MessageType.REQUEST, { eid }, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(new MyError(message.error, message.status))
                }
                resolve(message)
            })
            logger.info('Added subscriber ' + subscriberOid + ' to event channel ' + oid + ':' + eid)
        } else {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}
/**
 * Get property from the network
 *  If it does not exist, throws error
 * @param sourceOid 
 * @param pid 
 * @param oid 
 * @returns 
 */
export function getPropertyNetwork(sourceOid: string, pid: string, oid: string): JsonType {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(sourceOid)
        if (xmppClient) {
            logger.debug('Sending get property request to ' + oid + ':' + pid)
            xmppClient.sendStanza(oid, null, RequestOperation.GETPROPERTYVALUE, MessageType.REQUEST, { pid }, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(new MyError(message.error, message.status))
                }
                resolve(message)
            })
        } else {
            throw new MyError('XMPP client ' + sourceOid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}

/**
 *  Put property on the network object
 *  If it does not exist, throws error
 * @param sourceOid 
 * @param pid 
 * @param oid 
 * @param body 
 * @returns 
 */
export function putPropertyNetwork(sourceOid: string, pid: string, oid: string, body: JsonType): JsonType {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(sourceOid)
        if (xmppClient) {
            xmppClient.sendStanza(oid, body, RequestOperation.SETPROPERTYVALUE, MessageType.REQUEST, { pid }, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(message)
                }
                resolve(message)
            })
        } else {
            throw new MyError('XMPP client ' + sourceOid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}

/**
 * Removes subscriber from event channel for the given oid + eid
 * If it does not exist, throws error
 * @param oid - object id
 * @param eid - event id
 * @param subscriberOid - subscriber object id
 */
 export function removeSubscriberNetwork(oid: string, eid: string, subscriberOid: string) {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(subscriberOid)
        if (xmppClient) {
            xmppClient.sendStanza(oid, null, RequestOperation.UNSUBSCRIBEFROMEVENTCHANNEL, MessageType.REQUEST, { eid }, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(new MyError(message.error, message.status))
                }
                resolve(message)
            })
            logger.info('Remove subscriber ' + subscriberOid + ' from event channel ' + oid + ':' + eid)
        } else {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}

export function getEventChannelStatusNetwork(oid: string, eid: string, sourceOid: string): Promise<{ message: string }> {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(sourceOid)
        if (xmppClient) {
            xmppClient.sendStanza(oid, null, RequestOperation.GETEVENTCHANNELSTATUS, MessageType.REQUEST, { eid }, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(new MyError(message.error, message.status))
                }
                resolve(message as { message: string })
            })
        } else {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}

export function sendEventNetwork(oid: string, eid: string, sourceOid: string, body: JsonType) {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(sourceOid)
        if (xmppClient) {
            xmppClient.sendStanza(oid, body, RequestOperation.SETPROPERTYVALUE, MessageType.EVENT, { eid }, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(new MyError(message.error, message.status))
                }
                resolve(message)
            })
        } else {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}

/**
 * Sends a request to retrieve TD of and object, or sparql discovery query from another agent
 * Sends message over the network
 * @param oid 
 * @param sparql 
 */
 export const getObjectInfoNetwork =  async function (oid: string, destinationOid: string, sparql?: JsonType): Promise<JsonType> {
    return new Promise((resolve, reject) => {
        const xmppClient = clients.get(oid)
        if (xmppClient) {
            xmppClient.sendStanza(destinationOid, sparql ? sparql : null, RequestOperation.GETTHINGDESCRIPTION, MessageType.REQUEST, {}, {}, (err: boolean, message: JsonType) => {
                if (err) {
                    reject(new MyError(message.error, message.status))
                }
                resolve(message)
            })
        } else {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}
