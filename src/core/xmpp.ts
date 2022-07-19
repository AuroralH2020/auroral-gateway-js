/**
 * Interface to XMPP engine
 */
import { MyError, HttpStatusCode, logger } from '../utils'
import { XMPP } from './xmpp.class'
import { JsonType } from '../types/misc-types'
import { agent } from '../connectors/agent-connector'

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
 * Reload rosters for all XMPP clients
 */
export const reloadAllRosters = async function () {
    logger.debug('Reloading rosters for all XMPP clients')
    const keys = Array.from(clients.keys())
    for (let i = 0, l = keys.length; i < l; i++) {
        const xmpp = clients.get(keys[i])
        if (xmpp) {
            await xmpp.reloadRoster()
        }
    }
}

/**
 * Sends a request to retrieve TD of and object, or sparql discovery query from another agent
 * @param oid
 * @param destinationOid 
 * @param sparql 
 */
export const getObjectInfo =  async function (sourceoid: string, destinationOid: string, sparql?: JsonType) {
    const xmpp = clients.get(destinationOid)
    if (xmpp) {
        const response = await agent.discovery(sourceoid, destinationOid, sparql)
        if (response.error) {
            throw new MyError(response.error)
        } else {
            return { success: true, body: { message: response.message } }
        }
    } else {
        // send message to network
        return { success: false, body: {} }
    }
}
