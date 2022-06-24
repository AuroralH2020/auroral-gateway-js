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
type testType = string

export const nm = {

    // ***** AUTHENTICATION *****

    /**
     * Do handshake with AURORAL
     * @async
     * @returns {error?: string, message: string} 
     */
    handshake: async function(): Promise<GenericResponse<string>> {
        try {
            const msg = await request('handshake', 'GET', undefined, { ...ApiHeader, 'authorization': 'Bearer ' + Token.token })
            return msg
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Initial handshake failed...')
            throw new Error(error.message)
        }
    },
    /**
     *  Retrieve counters from NM
     * @returns {error?: string, message: string}
     */
    getCounters: async function(): Promise<GenericResponse<string>> {
        const msg = await request('counters', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     *  Post counters to NM
     * @param records 
     * @returns jsonType
     */
    postCounters: async function(records: JsonType): Promise<GenericResponse<void>> {
        const msg = await request('counters', 'POST', records, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get user roster from NM
     * @param oid 
     * @returns jsonType
     */
    getItemRoster: async function(oid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request('items/' + oid, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     *  Register item in NM
     * @param agid 
     * @param items 
     * @returns jsonType
     */
    registerItems: async function(agid: string, items: JsonType[]): Promise<GenericResponse<JsonType>> {
        const msg = await request('items/register', 'POST', { agid, items }, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     *  Remove item from NM
     * @param agid 
     * @param oids 
     * @returns jsonType
     */
    removeItems: async function(agid: string, oids: string[]): Promise<GenericResponse<JsonType>> {
        const msg = await request('items/remove', 'POST', { agid, oids }, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Update item in NM
     * @param agid 
     * @param oids 
     * @returns jsonType
     */
    modifyItems: async function(agid: string, items: JsonType[]): Promise<GenericResponse<JsonType>> {
        const msg = await request('items/modify', 'PUT', { agid, items }, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Delete agent from NM
     * @param agid 
     * @returns jsonType
     */
    deleteAgent: async function(agid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request('agent/' + agid, 'DELETE', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get agent items from NM
     * @param agid 
     * @returns jsonType
     */
    getAgentItems: async function(agid: string): Promise<GenericResponse<JsonType>> {
            const msg = await request(`agent/${agid}/items`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
            return msg 
    },
    /**
     * Get agent privacy from NM
     * @returns jsonType
     */
    getAgentPrivacy: async function(): Promise<GenericResponse<JsonType>> {
        const msg = await request('agent/privacy', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     *  Returns cid of from oid or agid
     * @param reqid 
     * @returns jsonType
     */
    getCidFromReqid: async function(reqid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request(`agent/cid/${reqid}`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Returns pertners
     * @returns jsonType
     */
    getPartners: async function(): Promise<GenericResponse<JsonType>> {
        const msg = await request('agent/partners', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get partner info from NM
     * @param cid 
     * @returns jsonType
     */
    getPartner: async function(cid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request(`agent/partner/${cid}`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get contracted items by cid of remote org
     * @param cid 
     * @returns jsonType
     */
    getContractedItemsByCid: async function(cid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request(`agent/contract/items/${cid}`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    // DISCOVERY
    /**
     *  Get my communities
     * @returns jsonType
     */
    getCommunities: async function(): Promise<GenericResponse<JsonType>> {
        const msg = await request('agent/communities', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get nodes in my organisation
     * @returns jsonType
     */
    getNodesInMyOrganisation: async function(): Promise<GenericResponse<JsonType>> {
        const msg = await request('discovery/nodes/organisation', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get nodes at given organisation
     * @param cid 
     * @returns jsonType
     */
    getNodesInOrganisation: async function(cid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request(`discovery/nodes/organisation/${cid}`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get nodes in given community
     * @param commId 
     * @returns jsonType
     */
    getNodesInCommunity: async function(commId: string): Promise<GenericResponse<JsonType>> {
        const msg = await request(`discovery/nodes/comunity/${commId}`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get items in my organisation
     * @returns jsonType
     */
    getItemsInMyOrganisation: async function(): Promise<GenericResponse<JsonType>> {
        const msg = await request('discovery/items/organisation', 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    },
    /**
     * Get items in given contract
     * @param ctid 
     * @returns jsonType
     */
    getItemsInContract: async function(ctid: string): Promise<GenericResponse<JsonType>> {
        const msg = await request(`discovery/items/contract/${ctid}`, 'GET', undefined, { ...ApiHeader, 'X-ACCESS-TOKEN': 'Bearer ' + Token.token })
        return msg
    }

}

// PRIVATE FUNCTIONS

const request = async (endpoint: string, method: Method, json?: JsonType, headers?: Headers, searchParams?: string): Promise<GenericResponse> => {
    const response = await callApi(endpoint, { method, json, headers, searchParams }) as unknown as Response<GenericResponse>
    return response.body
}

