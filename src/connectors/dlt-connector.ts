/**
* Interface to interact with the Neighbourhood Manager
* @interface
*/ 

import got, { Method, Headers, Response } from 'got'
import { Config } from '../config'
import { logger, errorHandler, HttpStatusCode, MyError } from '../utils'
import { GenericResponse } from '../types/nm-types'
import { DltUser, DltUserCreate } from '../types/dlt-types'
import { JsonType } from '../types/misc-types'
import { nmToken } from '../core/platformToken'

// CONSTANTS 

const callApi = got.extend({
    prefixUrl: Config.DLT.HOST + ':' + Config.DLT.PORT,
    responseType: 'json',
    isStream: false,
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: { 
        response: Number(Config.NM.TIMEOUT)
    }, // 10sec to timeout for response is the default
    decompress: true // accept-encoding header gzip
})

const callMgmtApi = got.extend({
    prefixUrl: Config.DLT.HOST + ':' + Config.DLT.MGMT_PORT,
    responseType: 'json',
    isStream: false,
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: { 
        response: Number(Config.NM.TIMEOUT)
    }, // 10sec to timeout for response is the default
    decompress: true // accept-encoding header gzip
})

const ApiHeader = { 
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
    simple: 'false' 
}

export const dlt = {
    /**
     * Get contract by ID
     * @async
     * @returns {error?: string, message: string} 
     */
    getContractById: async function(ctid: string): Promise<JsonType> {
        try {
            return await request('auroral/acl-test/contract/' + ctid, 'GET', undefined, { ...ApiHeader, 'authorization': 'Bearer ' + nmToken.token })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Getting contract by ID failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            logger.error(error)
            throw error
        }
    },
    /**
     * Get all contracts for my organisation
     * @async
     * @returns {error?: string, message: string} 
     */
    getOrgContract: async function(): Promise<JsonType> {
        try {
            return await request('auroral/acl-test/contract/list', 'GET', undefined, { ...ApiHeader, 'authorization': 'Bearer ' + nmToken.token })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Getting org contracts failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            logger.error(error)
            throw error
        }
    },
    /**
     * Get IDs of all my organisation contracts
     * @async
     * @returns {error?: string, message: string} 
     */
    getOrgContractIDs: async function(): Promise<JsonType> {
        try {
            return await request('auroral/acl-test/contract/list/IDs', 'GET', undefined, { ...ApiHeader, 'authorization': 'Bearer ' + nmToken.token })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Getting org contract IDs failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            logger.error(error)
            throw error
        }
    }
}

export const dltMgmt = {
    /**
     * Create User
     * @async
     * @returns DltUser 
     */
    createUser: async function(user: DltUserCreate): Promise<DltUser | null> {
        try {
            return await requestMgmt('users', 'POST', user, { ...ApiHeader }) as DltUser
        } catch (err: unknown) {
            const error = errorHandler(err)
            if (error.status === 409) {
                logger.warn('DLT User ' + user.email + ' already created...')
                return null
            }
            if (error.status === 400) {
                logger.warn('DLT User ' + user.email + ' already created...')
                logger.error('Creating dlt user failed due to misformed request...', HttpStatusCode.BAD_REQUEST)
                throw error
            }
            logger.error('Creating dlt user failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            throw error
        }
    },
    /**
     * Validate User
     * @async
     * @returns {error?: string, message: string} 
     */
    validateUser: async function(email: string): Promise<void> {
        try {
            const resp = await requestMgmt('users/' + email, 'PATCH', undefined, { ...ApiHeader })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Validating user by email failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            throw error
        }
    },
    /**
     * Get User
     * @async
     * @returns DltUser
     */
    getUser: async function(email: string): Promise<DltUser | null> {
        try {
            return await requestMgmt('users/' + email, 'GET', undefined, { ...ApiHeader }) as DltUser
        } catch (err: unknown) {
            const error = errorHandler(err)
            if (error.status === 400) {
                return null
            }
            logger.error('Getting user by email failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            throw error
        }
    },
     /**
     * Delete User
     * @async
     * @returns void
     */
     deleteUser: async function(email: string): Promise<void> {
        try {
            const resp = await requestMgmt('users/' + email, 'DELETE', undefined, { ...ApiHeader })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Deleting user by email failed...', HttpStatusCode.SERVICE_UNAVAILABLE)
            throw error
        }
    }   
}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string): Promise<JsonType> => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as unknown as Response<JsonType>
    return response.body
}

const requestMgmt = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string): Promise<JsonType> => {
    const response = await callMgmtApi(endpoint, { method, json, headers, searchParams }) as unknown as Response<JsonType>
    return response.body
}

