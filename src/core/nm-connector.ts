/**
* Interface to interact with the Neighbourhood Manager
* @interface
*/ 

import got, { Method, Headers, Response } from 'got'
import { Config } from '../config'
import { logger, errorHandler, HttpStatusCode } from '../utils'
import { GenericResponse } from '../types/nm-types'
import { Token } from './security'
import { JsonType } from '../types/misc-types'

// CONSTANTS 

const callApi = got.extend({
    prefixUrl: Config.NM.HOST,
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

// INTERFACE

export const nm = {

    // ***** AUTHENTICATION *****

    /**
     * Do handshake with AURORAL
     * @async
     * @returns {error?: string, message: string} 
     */
    handshake: async function(): Promise<GenericResponse<string>> {
        try {
            const msg = await request('handshake', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
            return msg
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Initial handshake failed...')
            throw new Error(error.message)
        }
    }

}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string): Promise<GenericResponse> => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as unknown as Response<GenericResponse>
    return response.body
}

