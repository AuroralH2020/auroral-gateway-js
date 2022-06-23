// Gateway response types

import { JsonType } from './misc-types'

/**
 * Generic gateway response
 */
export interface GatewayResponse<T = JsonType> {
    error: boolean
    statusCode: number
    statusCodeReason: string
    contentType: string
    message: T[]
}

// Specific gateway responses

export type GtwGetRegistrationsResponse = string

export interface GtwRegistrationResponse {
    oid: string,
    password: string | never,
    name: string,
    error: string | never
} 

export interface GtwUpdateResponse {
    oid: string
    test: boolean // TBD 
}

export type GtwDeleteResponse = {
    oid: string, 
    statusCode: number,
    error?: string
}

// Other related types

export interface RegistrationResultPost {
        oid: string
        password: string | null
        name: string
        error?: string
}

export interface RemovalBody {
    agid: string,
    oids: string[]
}

export interface IdDiscoveryType {
    objects: { oid: string }[]
}

export interface NodeType {
    agid: string,
    cid: string,
    company: string
}

export interface BasicResponse<T = JsonType> {
    error: string | null
    message: T
}
