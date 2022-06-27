// Controller common imports
import Express from 'express'
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'

// Imports
import { startXMPPClient, stopXMPPClients, getRoster, initialize, sendMessage } from '../../core/xmpp'
import { RequestOperation, MessageType } from '../../types/xmpp-types'
import { createEventChannel, getSubscribers, removeEventChannel } from '../../core/events'

// Controllers

type Ctrl = expressTypes.Controller<{}, {}, {}, null, { oid: string, password: string }>
type CtrlStringArray = expressTypes.Controller<{}, {}, {}, string[], { oid: string, password: string }>

export const start: Ctrl = async (req, res) => {
    const { oid, password } = res.locals
    try {
        await initialize(oid, password)
        await startXMPPClient(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

export const stop: Ctrl = async (req, res) => {
    const { oid, password } = res.locals
    try {
        await stopXMPPClients(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

export const roster: CtrlStringArray = async (req, res) => {
    const { oid, password } = res.locals
    try {
        const roster = await getRoster(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, roster)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type getPropertyCtrl = expressTypes.Controller<{ oid: string, pid: string}, {}, {}, string, { oid: string, password: string }>

export const getProperty: getPropertyCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const params = req.params
    try {
        const response = await sendMessage(oid, params.oid, null, RequestOperation.GETPROPERTYVALUE, MessageType.REQUEST)
        if (response.error) {
            return responseBuilder(HttpStatusCode.SERVICE_UNAVAILABLE, res, response.message)       
        } else {
            return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type PutPropertyCtrl = expressTypes.Controller<{}, { destination: string, message: string }, {}, string, { oid: string, password: string }>

export const putProperty: PutPropertyCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const { destination, message } = req.body
    try {
        if (!message) {
            return responseBuilder(HttpStatusCode.BAD_REQUEST, res, 'PUT requests requires a valid message to be sent...')
        }
        const response = await sendMessage(oid, destination, message, RequestOperation.SETPROPERTYVALUE, MessageType.REQUEST)
        if (response.error) {
            return responseBuilder(HttpStatusCode.SERVICE_UNAVAILABLE, res, response.message)       
        } else {
            return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type ActivateEventChannelCtrl = expressTypes.Controller<{ eid: string }, {}, {}, {}, { oid: string, password: string }>

export const activateEventChannel: ActivateEventChannelCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const { eid } = req.params
    try {
        // Call event module and add new channel EID
        createEventChannel(oid, eid)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type DectivateEventChannelCtrl = expressTypes.Controller<{ eid: string }, {}, {}, {}, { oid: string, password: string }>

export const dectivateEventChannel: DectivateEventChannelCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const { eid } = req.params
    try {
        // Call event module and remove channel EID
        removeEventChannel(oid, eid)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type PublishEventToChannelCtrl = expressTypes.Controller<{ eid: string }, string, {}, string, { oid: string, password: string }>

export const publishEventToChannel: PublishEventToChannelCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const { eid } = req.params
    const message = req.body
    try {
        // retrieve subscribers and send message to each one
        for (const subscriber of getSubscribers(oid, eid)) {
            sendMessage(oid, subscriber, message, RequestOperation.SETPROPERTYVALUE, MessageType.EVENT) // TBD: RequestOperation type ??
        }
        // TBD: Do we need to wait for responses?
        return responseBuilder(HttpStatusCode.OK, res, null, 'Channel with EID: ' + eid + 'successfully removed')
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type SubscribeToEventChannelCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, {}, { oid: string, password: string }>

export const subscribeToEventChannel: SubscribeToEventChannelCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const { eid } = req.params
    try {
        // TBD: Do we need to check if is local or remote?
        const response = await sendMessage(oid, eid, null, RequestOperation.SUBSCRIBETOEVENTCHANNEL, MessageType.REQUEST)
        if (response.error) {
            // TBD: Parse error code from response
            return responseBuilder(HttpStatusCode.BAD_REQUEST, res, response.message)
        }
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type UnsubscribeFromEventChannelCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, {}, { oid: string, password: string }>

export const unsubscribeFromEventChannel: UnsubscribeFromEventChannelCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const { eid } = req.params
    try {
       // TBD: Do we need to check if is local or remote?
       const response = await sendMessage(oid, eid, null, RequestOperation.UNSUBSCRIBEFROMEVENTCHANNEL, MessageType.REQUEST)
       if (response.error) {
           // TBD: Parse error code from response
           return responseBuilder(HttpStatusCode.BAD_REQUEST, res, response.message)
       }
       return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}
