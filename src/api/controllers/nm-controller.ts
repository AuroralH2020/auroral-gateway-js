// Controller common imports
import Express from 'express'
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'

// Imports
import {  GtwRegistrationResponse, GtwUpdateResponse } from '../../types/gateway-types'
import { nm } from '../../core/nm-connector'
import { JsonType } from '../../types/misc-types'

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

type getRegistrationsCtrl = expressTypes.Controller<{ agid: string }, {}, {}, JsonType, {}>

export const getRegistrations: getRegistrationsCtrl = async (req, res) => {
        try {
                const response = (await nm.getAgentItems(req.params.agid))
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
	} catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
	}
}

type postRegistrationsCtrl = expressTypes.Controller<{ agid1: string }, { items: JSON[], agid: string }, {}, JsonType, {}>
export const postRegistrations: postRegistrationsCtrl = async (req, res) => {
        const { agid, items } = req.body
        try {
                const response = await nm.registerItems(agid, items)
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
	} catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
	}
}

type updateRegistrationsCtrl = expressTypes.Controller<{ agid1: string }, { items: JSON[], agid: string }, {}, GtwUpdateResponse[], {}>
export const updateRegistrations: updateRegistrationsCtrl = async (req, res) => {
        const { agid, items } = req.body
        try {
                const response = await nm.modifyItems(agid, items)
                return responseBuilder(HttpStatusCode.OK, res, null,  response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type removeRegistrationCtrl = expressTypes.Controller<{ agid: string }, { oids: string[] }, {}, GtwUpdateResponse[], {}>
export const removeRegistration: removeRegistrationCtrl = async (req, res) => {
        const { oids } = req.body
        const { agid } = req.params
    try {
                const response = await nm.removeItems(agid, oids)
                return responseBuilder(HttpStatusCode.OK, res, null,  response.message)
        } catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
        }
}

type getNodesInMyOrganisationCtrl = expressTypes.Controller<{}, {}, {}, GtwUpdateResponse[], {}>

export const getNodesInMyOrganisation: getNodesInMyOrganisationCtrl = async (req, res) => {
        try {
                const response = await nm.getNodesInMyOrganisation()
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getNodesInCommunityCtrl = expressTypes.Controller<{ commid: string }, {}, {}, GtwUpdateResponse[], {}>
export const getNodesInCommunity: getNodesInCommunityCtrl = async (req, res) => {
        const { commid } = req.params
        try {
                const response = await nm.getNodesInCommunity(commid)
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getItemsInMyOrganisationCtrl = expressTypes.Controller<{  }, {}, {}, GtwUpdateResponse[], {}>
export const getItemsInMyOrganisation: getItemsInMyOrganisationCtrl = async (req, res) => {
        try {
                const response = await nm.getItemsInMyOrganisation()
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getItemsInContractCtrl = expressTypes.Controller<{ ctid: string }, {}, {}, GtwUpdateResponse[], {}>
export const getItemsInContract: getItemsInContractCtrl = async (req, res) => {
        const { ctid } = req.params
        try {
                const response = await nm.getItemsInContract(ctid)
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getCidFromReqidCtrl = expressTypes.Controller<{ reqid: string }, {}, {}, GtwUpdateResponse[], {}>
export const getCidFromReqid: getCidFromReqidCtrl = async (req, res) => {
        const { reqid } = req.params
        try {
                const response = await nm.getCidFromReqid(reqid)
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getPartnersCtrl = expressTypes.Controller<{}, {}, {}, GtwUpdateResponse[], {}>
export const getPartners: getPartnersCtrl = async (req, res) => {
        try {
                const response = await nm.getPartners()
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getCommunitiesCtrl = expressTypes.Controller<{}, {}, {}, GtwUpdateResponse[], {}>
export const getCommunities: getCommunitiesCtrl = async (req, res) => {
        try {
                const response = await nm.getCommunities()
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getPartnerCtrl = expressTypes.Controller<{ cid: string }, {}, {}, GtwUpdateResponse[], {}>
export const getPartner: getPartnerCtrl = async (req, res) => {
        const { cid } = req.params
        try {
                const response = await nm.getPartner(cid)
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getAgentPrivacyCtrl = expressTypes.Controller<{}, {}, {}, GtwUpdateResponse[], {}>
export const getAgentPrivacy: getAgentPrivacyCtrl = async (req, res) => {
        try {
                const response = await nm.getAgentPrivacy()
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}

type getContractedItemsByCidCtrl = expressTypes.Controller<{ cid: string }, {}, {}, GtwUpdateResponse[], {}>
export const getContractedItemsByCid: getContractedItemsByCidCtrl = async (req, res) => {
        const { cid } = req.params
        try {
                const response = await nm.getContractedItemsByCid(cid)
                return responseBuilder(HttpStatusCode.OK, res, null, response.message)
        } catch (err) {
                const error = errorHandler(err)
                logger.error(error.message)
                return responseBuilder(error.status, res, error.message)
        }
}
