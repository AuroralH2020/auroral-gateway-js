/**
 * Interface to XMPP engine
 */
import { logger, MyError, HttpStatusCode } from '../utils'
import { RequestOperation, MessageType } from '../types/xmpp-types'
import { XMPP } from './xmpp.class'
import { JsonType } from '../types/misc-types'

export const clients = new Map<string, XMPP>()

/**
 * Generator of XMPP clients
 * @param oid 
 * @param password 
 */
export const initialize = function (oid: string, password: string) {
    const xmpp = clients.get(oid)
    if (!xmpp) {
        clients.set(
            oid,
            new XMPP(oid, password)
        )
    }
}

/**
 * Login XMPP client
 * @param oid 
 */
export const startXMPPClient = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.start()
    } else {
        throw new MyError('XMPP Client not found in pool', HttpStatusCode.NOT_FOUND)
    }
}

/**
 * Logout XMPP client
 * @param oid 
 * @param callback 
 */
export const stopXMPPClients = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.stop()
    } else {
        throw new MyError('XMPP Client not found in pool', HttpStatusCode.NOT_FOUND)
    }
}

/**
 * Logout all XMPP clients connected with this app
 * @param callback 
 */
export const stopAllXMPPClients = async function (callback: (err?: string) => void) {
   const keys = Array.from(clients.keys())
   for (let i = 0, l = keys.length; i < l; i++) {
        const xmpp = clients.get(keys[i])
        if (xmpp) {
            await xmpp.client.stop()
        }
   }
   callback()
}

/**
 * Get roster of one XMPP client
 * @param oid 
 */
export const getRoster = async function (oid: string): Promise<string[]> {
    const xmpp = clients.get(oid)
    if (xmpp) {
        return xmpp.getRoster()
    } else {
        throw new MyError('XMPP Client not found in pool', HttpStatusCode.NOT_FOUND)
    }
}

/**
 * Refresh roster of one XMPP client
 * @param oid 
 */
export const reloadRoster = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.reloadRoster()
    } else {
        throw new MyError('XMPP Client not found in pool', HttpStatusCode.NOT_FOUND)
    }
}

/**
 * Send stanza to some other client of the XMPP network
 * @param oid 
 * @param destination 
 * @param message 
 * @returns 
 */
export const sendMessage = function (oid: string, destination: string, message: JsonType | null, requestOperation: RequestOperation, messageType: MessageType): Promise<{error: boolean, message: JsonType}> {
    return new Promise((resolve, reject) => {
        const xmpp = clients.get(oid)
        if (xmpp) {
                xmpp.sendStanza(destination, message, requestOperation, messageType, {}, {}, (error, message) => {
                    resolve({ error, message })
                })
        } else {
            throw new MyError('XMPP Client not found in pool', HttpStatusCode.NOT_FOUND)
        }
    })
}
