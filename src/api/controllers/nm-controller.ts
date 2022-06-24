// Controller common imports
import Express from 'express'
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'

// Imports
import { GtwGetRegistrationsResponse, GtwRegistrationResponse, GtwUpdateResponse } from '../../types/gateway-types'

// Controllers

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
