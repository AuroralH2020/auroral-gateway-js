// Controller common imports
import Express from 'express'
import { expressTypes } from '../types/index'
import { HttpStatusCode } from '../utils/http-status-codes'
import { logger, errorHandler } from '../utils'
import { responseBuilder } from '../utils/response-builder'

// Imports
import { startXMPPClient, stopXMPPClients, getRoster, initialize, sendMessage } from '../core/xmpp'
import { GtwGetRegistrationsResponse, GtwRegistrationResponse, GtwUpdateResponse } from '../types/gateway-types'

// Controllers

type Ctrl = expressTypes.Controller<{ oid: string }, {}, {}, null, {}>
 
export const start: Ctrl = async (req, res) => {
    const { oid } = req.params
    try {
        await startXMPPClient(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

export const stop: Ctrl = async (req, res) => {
    const { oid } = req.params
    try {
        await stopXMPPClients(oid, (err) => { })
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

export const roster: Ctrl = async (req, res) => {
    const { oid } = req.params
    try {
        await getRoster(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type InitCtrl = expressTypes.Controller<{}, { oid: string, password: string }, {}, null, {}>

export const init: InitCtrl = async (req, res) => {
    const { oid, password } = req.body
    try {
        await initialize(oid, password)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

// type SendCtrl = expressTypes.Controller<{ oid: string }, { destination: string, message: string }, {}, string, {}>

export const send = async (req: Express.Request, res: Express.Response) => {
    const { oid } = req.params
    const { destination, message } = req.body
    try {
        sendMessage(oid, destination, message, (error, message) => {
            if (error) {
                return responseBuilder(HttpStatusCode.SERVICE_UNAVAILABLE, res, message)       
            }
            return responseBuilder(HttpStatusCode.OK, res, null, message)
        })
    } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type DummyCtrl = expressTypes.Controller<{}, { }, {}, null, {}>

export const dummy: DummyCtrl = async (req, res) => {
    try {
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type getRegistrationsCtrl = expressTypes.Controller<{ agid: string }, {}, {}, GtwGetRegistrationsResponse[], {}>

export const getRegistrations: getRegistrationsCtrl = async (req, res) => {
    try {
        return responseBuilder(HttpStatusCode.OK, res, null, ['reg1'])
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type postRegistrationsCtrl = expressTypes.Controller<{ agid1: string }, { items: JSON[], agid: string }, {}, GtwRegistrationResponse[], {}>

export const postRegistrations: postRegistrationsCtrl = async (req, res) => {
    try {
        return responseBuilder(HttpStatusCode.OK, res, null,  [{ oid: 'string', name: 'string', password: 'string' }])
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type updateRegistrationsCtrl = expressTypes.Controller<{ agid1: string }, { items: JSON[], agid: string }, {}, GtwUpdateResponse[], {}>
export const updateRegistrations: updateRegistrationsCtrl = async (req, res) => {
    try {
        return responseBuilder(HttpStatusCode.OK, res, null,  [{ oid: 'string', test: true as boolean }])
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}
