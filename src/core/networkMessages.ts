import fs from 'fs'
import { HttpStatusCode , logger , MyError } from '../utils'
import { Config } from '../config'
import { clients } from './xmpp'
import { EventHandler } from './event.class'
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
            xmppClient.sendStanza(oid, null, RequestOperation.SUBSCRIBETOEVENTCHANNEL, MessageType.REQUEST, { eid }, {}, (err: boolean, message: string) => {
                if (err) {
                    reject(message)
                }
                resolve(message)
            })
            logger.info('Added subscriber ' + subscriberOid + ' to event channel ' + oid + ':' + eid)
        } else {
            throw new MyError('XMPP client ' + oid + ' does not exist', HttpStatusCode.NOT_FOUND) 
        }
    })
}