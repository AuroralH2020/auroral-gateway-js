// Controller common imports
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'

// Imports
import { dlt } from '../../connectors/dlt-connector'
import { JsonType } from '../../types/misc-types'
import { BasicAuthLocals } from '../../types/locals-types'

/**
 * Controllers
 */   

type CtrlContracts = expressTypes.Controller<{}, {}, {}, JsonType, BasicAuthLocals>

export const getContracts: CtrlContracts = async (_req, res) => {
    const { oid, password } = res.locals
    try {
        const result = await dlt.getOrgContract()
        return responseBuilder(HttpStatusCode.OK, res, null, result)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}

type CtrlContractInfo = expressTypes.Controller<{ ctid: string }, {}, {}, JsonType, BasicAuthLocals>

export const getContractInfo: CtrlContractInfo = async (req, res) => {
    const { oid, password } = res.locals
    try {
        const ctid = req.params.ctid
        const result = await dlt.getContractById(ctid)
        return responseBuilder(HttpStatusCode.OK, res, null, result)
	} catch (err) {
        const error = errorHandler(err)
        logger.error(error.message)
        return responseBuilder(error.status, res, error.message)
	}
}
