// Controller common imports
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'

// Imports
import { startXMPPClient, stopXMPPClients, getRoster, initialize, getObjectInfo } from '../../core/xmpp'
import { events } from '../../core/events'
import { getPropertyNetwork, putPropertyNetwork, addSubscriberNetwork, removeSubscriberNetwork, getEventChannelStatusNetwork, sendEventNetwork, getObjectInfoNetwork } from '../../core/networkMessages'
import { JsonType } from '../../types/misc-types'
import { getPropertyLocaly, putPropertyLocaly } from '../../core/properties'

/**
 * Controllers
 */   

// Authentication controllers

type Ctrl = expressTypes.Controller<{}, {}, {}, null, { oid: string, password: string }>

export const start: Ctrl = async (_req, res) => {
    const { oid, password } = res.locals
    try {
        initialize(oid, password)
        await startXMPPClient(oid)
        events.loadEventChannelsFromFile()
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

export const stop: Ctrl = async (_req, res) => {
    const { oid } = res.locals
    try {
        await stopXMPPClients(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, null)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

// Discovery controllers

type CtrlStringArray = expressTypes.Controller<{}, {}, {}, string[], { oid: string, password: string }>

export const roster: CtrlStringArray = async (_req, res) => {
    const { oid } = res.locals
    try {
        const objRoster = await getRoster(oid)
        return responseBuilder(HttpStatusCode.OK, res, null, objRoster)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type CtrlSparqlDiscovery = expressTypes.Controller<{ oid: string }, {}, JsonType | undefined, JsonType, { oid: string, password: string }>

export const discovery: CtrlSparqlDiscovery = async (req, res) => {
    const { oid } = res.locals
    const params = req.params
    const sparql = req.body
    try {
        const localResponse = await getObjectInfo(oid, params.oid, sparql)
        if (localResponse.success) {
            return responseBuilder(HttpStatusCode.OK, res, null, localResponse.body.message as JsonType)
        } else {
            const remoteResponse = await getObjectInfoNetwork(oid, params.oid, sparql)
            return responseBuilder(HttpStatusCode.OK, res, null, [{ message: remoteResponse }] as JsonType)
        }
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

// Resource consumption controllers

type getPropertyCtrl = expressTypes.Controller<{ oid: string, pid: string}, {}, {}, JsonType, { oid: string, password: string }>

export const getProperty: getPropertyCtrl = async (req, res) => {
    const { oid } = res.locals
    const params = req.params
    try {
        // test localy if the client exists
        logger.debug(`GetProperty request OID:${params.oid} PID:${params.pid}`)
        const localResponse = await getPropertyLocaly(oid , params.pid, params.oid)
        if (!localResponse.success) {
             // if not, get the property from the network
             const remoteResponse = await getPropertyNetwork(oid, params.pid, params.oid)
            return responseBuilder(HttpStatusCode.OK, res, null, [{ message: remoteResponse }] as JsonType)
        } else {
            return responseBuilder(HttpStatusCode.OK, res, null, localResponse.body)       
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type PutPropertyCtrl = expressTypes.Controller<{ oid: string, pid: string }, JsonType, {}, JsonType, { oid: string, password: string }>

export const putProperty: PutPropertyCtrl = async (req, res) => {
    const { oid } = res.locals
    const params = req.params
    const body = req.body
    try {
        // test localy if the client exists
        logger.debug(`PutProperty request OID:${params.oid} PID:${params.pid}`)
        const localResponse = await putPropertyLocaly(oid , params.pid, params.oid, body)
        if (!localResponse.success) {
             // if not, get the property from the network
             const remoteResponse = await putPropertyNetwork(oid, params.pid, params.oid, body)
            return responseBuilder(HttpStatusCode.OK, res, null, [{ message: remoteResponse }] as JsonType)
        } else {
            return responseBuilder(HttpStatusCode.OK, res, JSON.stringify(localResponse.body))       
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

// Event controllers

type ActivateEventChannelCtrl = expressTypes.Controller<{ eid: string }, {}, {}, {}, { oid: string, password: string }>

export const activateEventChannel: ActivateEventChannelCtrl = async (req, res) => {
    const { oid } = res.locals
    const { eid } = req.params
    try {
        events.createEventChannel(oid, eid)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type DectivateEventChannelCtrl = expressTypes.Controller<{ eid: string }, {}, {}, {}, { oid: string, password: string }>

export const dectivateEventChannel: DectivateEventChannelCtrl = async (req, res) => {
    const { oid } = res.locals
    const { eid } = req.params
    try {
        events.removeEventChannel(oid, eid)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type GetEventChannelsCtrl = expressTypes.Controller<{ oid: string }, {}, {}, string[], { oid: string, password: string }>

export const getEventChannels: GetEventChannelsCtrl = async (req, res) => {
    const params = req.params
    try {
        const eChannels = events.getEventChannelsNames(params.oid)
        return responseBuilder(HttpStatusCode.OK, res, null, eChannels)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type SubscribeToEventChannelCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, string, { oid: string, password: string }>

export const subscribeToEventChannel: SubscribeToEventChannelCtrl = async (req, res) => {
    const { oid } = res.locals
    const params = req.params
    try {
        const response = events.addSubscriber(params.oid, params.eid, oid)
        if (!response.success) {
            await addSubscriberNetwork(params.oid, params.eid, oid)
            return responseBuilder(HttpStatusCode.OK, res, null, 'Object ' + oid + ' subscribed channel ' + params.eid + ' of remote object ' + params.oid)
        } else {
            return responseBuilder(HttpStatusCode.OK, res, null, 'Object ' + oid + ' subscribed channel ' + params.eid + ' of local object ' + params.oid)
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type UnsubscribeFromEventChannelCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, string, { oid: string, password: string }>

export const unsubscribeFromEventChannel: UnsubscribeFromEventChannelCtrl = async (req, res) => {
    const { oid } = res.locals
    const params = req.params
    try {
        const response = events.removeSubscriber(params.oid, params.eid, oid)
        if (!response.success) {
            await removeSubscriberNetwork(params.oid, params.eid, oid)
            return responseBuilder(HttpStatusCode.OK, res, null, 'Object ' + oid + ' unsusbcribed channel ' + params.eid + ' of remote object ' + params.oid)
        } else {
            return responseBuilder(HttpStatusCode.OK, res, null, 'Object ' + oid + ' unsusbcribed channel ' + params.eid + ' of local object ' + params.oid)
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type PublishEventToChannelCtrl = expressTypes.Controller<{ eid: string }, JsonType, {}, string, { oid: string, password: string }>

export const publishEventToChannel: PublishEventToChannelCtrl = async (req, res) => {
    const { oid } = res.locals
    const { eid } = req.params
    const message = req.body
    try {
        // retrieve subscribers and send message to each one
        for (const subscriber of events.getSubscribers(oid, eid)) {
            try {
                const response = events.sendEvent(oid, subscriber, eid, message)
                if (!response.success) {
                    logger.debug(`PublishEventToChannel: ${oid} ${eid} ${subscriber} ${message}`)
                    await sendEventNetwork(oid, subscriber, eid, message)
                }
            } catch (error) {
                logger.error('Error sending event to ' + subscriber + ': ' + error)
            }
        }
        // TBD: Do we need to wait for responses?
        return responseBuilder(HttpStatusCode.OK, res, null, 'Event distributed to N subscribers')
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type EventChannelStatusCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, string, { oid: string, password: string }>

export const eventChannelStatus: EventChannelStatusCtrl = async (req, res) => {
    const { oid } = res.locals
    const params = req.params
    try {  
        logger.debug('Event channel status for object ' + params.oid + ' channel ' + params.eid)
        const response = events.channelStatus(params.oid, params.eid, oid)
        if (response.success) {
            return responseBuilder(HttpStatusCode.OK, res, null, response.body.message)
        } else {
            // network
            const networkResponse = await getEventChannelStatusNetwork(params.oid, params.eid, oid)
            return responseBuilder(HttpStatusCode.OK, res, null, networkResponse.message)
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}
