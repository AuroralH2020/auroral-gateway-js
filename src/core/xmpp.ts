/**
 * Interface to XMPP engine
 */
import { logger } from '../utils'
import { XMPP } from './xmpp.class'

const clients = new Map<string, XMPP>()

/**
 * Generator of XMPP clients
 * @param oid 
 * @param password 
 */
export const initialize = function (oid: string, password: string) {
    clients.set(
        oid,
        new XMPP(oid, password)
    )
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
        logger.warn('XMPP client not found')
    }
}

/**
 * Logout XMPP client
 * @param oid 
 * @param callback 
 */
export const stopXMPPClients = async function (oid: string, callback: (err?: string) => void) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.stop()
        callback()
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
export const getRoster = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.getRoster()
    } else {
        logger.warn('XMPP client not found')
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
        logger.warn('XMPP client not found')
    }
}

/**
 * Send stanza to some other client of the XMPP network
 * @param oid 
 * @param destination 
 * @param message 
 * @returns 
 */
export const sendMessage = function (oid: string, destination: string, message: string): Promise<{error: boolean, message: string}> {
    return new Promise((resolve, reject) => {
        const xmpp = clients.get(oid)
        if (xmpp) {
                xmpp.sendStanza(destination, message, (error, message) => {
                    resolve({ error, message })
                })
        } else {
            logger.warn('XMPP client not found')
            resolve({ error: true, message: 'OID not found on destination' })
        }
    })
}
