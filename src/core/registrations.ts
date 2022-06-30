import { Config } from '../config'
import { nm } from '../connectors/nm-connector'
import { logger, errorHandler } from '../utils'

let registration = undefined as string[] | undefined

/**
 * Retrieves all oids registered under my agent
 * if not yet initialised, retrieve them from NM automatically
 * @returns registrations array
 */
export const getRegistrations = async function (): Promise<string[]> {
    if (registration) {
        return registration
    } else {
        await updateLocalRegistrations()
        return registration ? registration : []
    }
}

/**
 * Updates the registrations array from NM
 */
export const updateLocalRegistrations = async function () {
    try {
        const response = await nm.getAgentItems(Config.GATEWAY.ID)
        registration = response.message
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error('Updating registrations failed...' + error.message)
    }
}

/**
 * Check if the given oid is registered under my agent
 * @param oid Items oid
 * @returns true/false if the oid is registered
 */
export const isItemRegistered = async function (oid: string): Promise<boolean> {
    const registrations = await getRegistrations()
    return registrations.includes(oid)
}
