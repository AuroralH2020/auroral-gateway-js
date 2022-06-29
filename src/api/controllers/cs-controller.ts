// Controller common imports
import Express from 'express'
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'

// Imports
import { startXMPPClient, stopXMPPClients, getRoster, initialize, sendMessage, clients } from '../../core/xmpp'
import { RequestOperation, MessageType } from '../../types/xmpp-types'
import { createEventChannel, getSubscribers, removeEventChannel, getEventChannelsNames, addSubscriber, removeSubscriber, loadEventChannels } from '../../core/events'
import { getPropertyNetwork, putPropertyNetwork, addSubscriberNetwork, removeSubscriberNetwork } from '../../core/networkMessages'
import { JsonType } from '../../types/misc-types'
import { agent } from '../../connectors/agent-connector'
import { getPropertyLocaly, putPropertyLocaly } from '../../core/properties'

// Controllers

type Ctrl = expressTypes.Controller<{}, {}, {}, null, { oid: string, password: string }>
type CtrlStringArray = expressTypes.Controller<{}, {}, {}, string[], { oid: string, password: string }>

export const start: Ctrl = async (req, res) => {
    const { oid, password } = res.locals
    try {
        initialize(oid, password)
        await startXMPPClient(oid)
        loadEventChannels()
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

type getPropertyCtrl = expressTypes.Controller<{ oid: string, pid: string}, {}, {}, JsonType, { oid: string, password: string }>

export const getProperty: getPropertyCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const params = req.params
    try {
        // test localy if the client exists
        const localResponse = await getPropertyLocaly(oid, params.pid, params.oid)
        if (localResponse.success) {
            return responseBuilder(HttpStatusCode.OK, res, JSON.stringify(localResponse.body))       
        } else {
            // if not, get the property from the network
            const remoteResponse = getPropertyNetwork(oid, params.pid, params.oid)
            if (remoteResponse.success) {
                return responseBuilder(HttpStatusCode.OK, res, null, remoteResponse.body)
            } else {
                return responseBuilder(HttpStatusCode.NOT_FOUND, res, remoteResponse.body)
            }
        }
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type PutPropertyCtrl = expressTypes.Controller<{ oid: string, pid: string }, JsonType, {}, JsonType, { oid: string, password: string }>

export const putProperty: PutPropertyCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const body = req.body
    const params = req.params
    try {
        if (!body) {
            return responseBuilder(HttpStatusCode.BAD_REQUEST, res, 'PUT requests requires a valid message to be sent...')
        }
        // test localy if the client exists
        const localResponse = await putPropertyLocaly(oid, params.pid, params.oid, body)
        if (localResponse.success) {
            return responseBuilder(HttpStatusCode.OK, res, JSON.stringify(localResponse.body))       
        } else {
            // if not, get the property from the network
            const remoteResponse = putPropertyNetwork(oid, params.pid, params.oid, body)
            if (remoteResponse.success) {
                return responseBuilder(HttpStatusCode.OK, res, null, remoteResponse.body)
            } else {
                return responseBuilder(HttpStatusCode.NOT_FOUND, res, remoteResponse.body)
            }
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
        removeEventChannel(oid, eid)
        return responseBuilder(HttpStatusCode.OK, res, null)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

type GetEventChannelsCtrl = expressTypes.Controller<{ oid: string }, {}, {}, string[], { oid: string, password: string }>

export const getEventChannels: GetEventChannelsCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const params = req.params
    try {
        const eChannels = getEventChannelsNames(params.oid)
        return responseBuilder(HttpStatusCode.OK, res, null, eChannels)
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
    }
}

// type GetEventChannelStatusCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, {}, { oid: string, password: string }>

// export const getRemoteEventChannelStatus: GetEventChannelStatusCtrl = async (req, res) => {
//     const { oid, password } = res.locals
//     const { eid } = req.params
//     try {
//         // TBD: Do we need to check if is local or remote?
//         const response = await sendMessage(oid, eid, null, RequestOperation.SUBSCRIBETOEVENTCHANNEL, MessageType.REQUEST)
//         if (response.error) {
//             // TBD: Parse error code from response
//             return responseBuilder(HttpStatusCode.BAD_REQUEST, res, response.error)
//         }
//         return responseBuilder(HttpStatusCode.OK, res, null)
//     } catch (err: unknown) {
//         const error = errorHandler(err)
//         logger.error(error.message)
//         return responseBuilder(error.status, res, error.message)
//     }
// }

type SubscribeToEventChannelCtrl = expressTypes.Controller<{ oid: string, eid: string }, {}, {}, string, { oid: string, password: string }>

export const subscribeToEventChannel: SubscribeToEventChannelCtrl = async (req, res) => {
    const { oid, password } = res.locals
    const params = req.params
    try {
        const response = addSubscriber(params.oid, params.eid, oid)
        if (!response.success) {
            const networkResponse = await addSubscriberNetwork(params.oid, params.eid, oid)
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
    const { oid, password } = res.locals
    const params = req.params
    try {
        const response = await removeSubscriber(params.oid, params.eid, oid)
        if (!response.success) {
            const networkResponse = await removeSubscriberNetwork(params.oid, params.eid, oid)
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
