// Controller common imports
import fs from 'fs'
import path from 'path'
import { expressTypes } from '../../types/index'
import { HttpStatusCode } from '../../utils/http-status-codes'
import { logger, errorHandler } from '../../utils'
import { responseBuilder } from '../../utils/response-builder'
import { Config } from '../../config'
import { getJwt, authenticate } from '../../core/externalAuth'

// Imports

/**
 * Controllers
 */   

type getHealtcheckCtrl = expressTypes.Controller<{}, {}, {}, { version: string }, {}>

export const healthcheck: getHealtcheckCtrl = async (_req, res) => {
        try {
            const version = JSON.parse(fs.readFileSync(path.join(Config.HOME_PATH, 'package.json')).toString()).version
            return responseBuilder(HttpStatusCode.OK, res, null, { version })
        } catch (err) {
            const error = errorHandler(err)
            logger.error(error.message)
            return responseBuilder(error.status, res, error.message)
        }
}

type signExternalCtrl = expressTypes.Controller<{ sourceOid: string, oid: string, pid: string}, {}, {}, string, {}>

export const signExternal: signExternalCtrl = async (req, res) => {
        const { sourceOid, oid, pid } = req.params
        try {
            const token = await getJwt(sourceOid, oid, pid)
            return responseBuilder(HttpStatusCode.OK, res, null, token)
        } catch (err) {
            const error = errorHandler(err)
            logger.error(error.message)
            return responseBuilder(error.status, res, error.message)
        }
}

type validateExternalCtrl = expressTypes.Controller<{}, {}, { token: string }, null, {}>

export const validateExternal: validateExternalCtrl = async (req, res) => {
        const { token } = req.query
        try {
            await authenticate(token)
            return responseBuilder(HttpStatusCode.OK, res, null)
        } catch (err) {
            const error = errorHandler(err)
            logger.error(error.message)
            return responseBuilder(error.status, res, error.message)
        }
}
