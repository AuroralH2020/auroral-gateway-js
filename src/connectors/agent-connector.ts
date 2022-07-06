/**
* Interface to interact with the Neighbourhood Manager
* @interface
*/ 

import got, { Method, Headers, Response } from 'got'
import { Config } from '../config'
import { logger, errorHandler, HttpStatusCode, MyError } from '../utils'
import { GenericResponse } from '../types/nm-types'
import { JsonType } from '../types/misc-types'

// CONSTANTS 

const callApi = got.extend({
    prefixUrl: Config.AGENT.IP + ':' + Config.AGENT.PORT + '/agent/',
    responseType: 'json',
    isStream: false,
    throwHttpErrors: true, // If true 4XX and 5XX throw an error
    timeout: { 
        response: Number(Config.AGENT.TIMEOUT)
    }, // 10sec to timeout for response is the default
    decompress: true // accept-encoding header gzip
})

const ApiHeader = { 
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json',
    simple: 'false' 
}

export const agent = {
    getProperty: async function(sourceoid: string, pid: string, oid: string): Promise<GenericResponse<JsonType>> {
        try {
            logger.debug('Getting property from agent: OID:' + oid + ' PID:' + pid)
            return await request(`objects/${oid}/properties/${pid}`, 'GET', undefined, { ...ApiHeader, 'sourceoid': sourceoid })
            // const response = await Promise.resolve({ message: { test: 'ok' } }) as GenericResponse<any>
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Getproperty failed...')
            throw new MyError(error.message, error.status)
        }
    },
    putProperty: async function(sourceoid: string, pid: string, oid: string, body: JsonType): Promise<GenericResponse<JsonType>> {
        try {
            logger.debug('Putting property to agent: ' + oid + ' ' + pid)
            return await request(`objects/${oid}/properties/${pid}`, 'PUT', body, { ...ApiHeader, 'sourceoid': sourceoid })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Putproperty failed...')
            throw new MyError(error.message, error.status)
        }
    },
    putEvent: async function(oid: string, eid: string, value: JsonType): Promise<GenericResponse<string>> {
        try {
            return await request(`objects/${oid}/events/${eid}`, 'PUT', value , { ...ApiHeader })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Putevent failed...')
            throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
        }
    },
    discovery: async function(sourceoid: string, destinationOid: string, sparql: JsonType | undefined): Promise<GenericResponse<JsonType>> {
        try {
            return await request(`objects/${destinationOid}/discovery`, 'GET', sparql, { ...ApiHeader, 'sourceoid': sourceoid })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Discovery failed...')
            throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
        }
    },
    notify: async function(agid: string, nid: string, data: JsonType): Promise<GenericResponse<string>> {
        try {
            return await request(`objects/${agid}/notification/${nid}`, 'POST', data , { ...ApiHeader })
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Notify failed...')
            throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
        }
    }
}

// PRIVATE FUNCTIONS
const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string): Promise<GenericResponse> => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as unknown as Response<GenericResponse>
    return response.body
}

