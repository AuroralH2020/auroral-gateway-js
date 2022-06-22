import { logger } from '../utils'
import { XMPP } from './xmpp.class'

const clients = new Map<string, XMPP>()

export const initialize = function (oid: string, password: string) {
    clients.set(
        oid,
        new XMPP(oid, password)
    )
}

export const startXMPPClient = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.start()
    } else {
        logger.warn('XMPP client not found')
    }
}

export const stopXMPPClients = async function (oid: string, callback: (err?: string) => void) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.stop()
        callback()
    }
}

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

export const getRoster = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.getRoster()
    } else {
        logger.warn('XMPP client not found')
    }
}

export const reloadRoster = async function (oid: string) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        await xmpp.reloadRoster()
    } else {
        logger.warn('XMPP client not found')
    }
}

export const sendMessage = function (oid: string, destination: string, message: string, callback: (error: boolean, message: string) => void) {
    const xmpp = clients.get(oid)
    if (xmpp) {
        xmpp.sendStanza(destination, message, (error, message) => {
            callback(error, message)
        })
    } else {
        logger.warn('XMPP client not found')
        callback(true, 'OID not found on destination')
    }
}
