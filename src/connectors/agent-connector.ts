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
    prefixUrl: Config.AGENT.IP + ':' + Config.AGENT.PORT + '/agent',
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
    getProperty: async function(sourceoid: string, oid: string, pid: string): Promise<GenericResponse<JsonType>> {
        try {
            const response = await  request(`/objects/${oid}/properties/${pid}`, 'GET', undefined, { ...ApiHeader, 'sourceoid': sourceoid })
            return response.message
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Getproperty failed...')
            throw new MyError(error.message, error.status)
        }
    },
    putProperty: async function(sourceoid: string, oid: string, pid: string, body: JsonType): Promise<GenericResponse<string>> {
        try {
            const response = await  request(`/objects/${oid}/properties/${pid}`, 'PUT', body, { ...ApiHeader, 'sourceoid': sourceoid })
            return response        
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Putproperty failed...')
            throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
        }
    },
    putEvent: async function(oid: string, eid: string, value: JsonType): Promise<GenericResponse<string>> {
        try {
            const response = await  request(`/objects/${oid}/events/${eid}`, 'PUT', value , { ...ApiHeader })
            return response        
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Putevent failed...')
            throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
        }
    },
    discovery: async function(sourceoid: string, oid: string, sparql: string | undefined): Promise<GenericResponse<string>> {
        try {
            const response = await  request(`/objects/${oid}/discovery`, 'GET', sparql ? { sparql } : undefined, { ...ApiHeader, 'sourceoid': sourceoid })
            return response        
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Discovery failed...')
            throw new MyError(error.message, HttpStatusCode.BAD_REQUEST)
        }
    },
    notify: async function(agid: string, nid: string, data: JsonType): Promise<GenericResponse<string>> {
        try {
            const response = await  request(`/objects/${agid}/notification/${nid}`, 'POST', data , { ...ApiHeader })
            return response        
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

