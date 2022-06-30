/** 
 * GUARD MIDDLEWARE
 * Extracts user and password from credentials
 */
 import { expressTypes } from '../types/index'
 import { responseBuilder } from '../utils/response-builder'
import { isItemRegistered } from '../core/registrations'
import { HttpStatusCode, errorHandler, logger } from '../utils'

 type basicAuthCtrl = expressTypes.Controller<{}, {}, {}, void, { oid: string, password: string }>
 
 export const basicAuth = () => {
     return function (req, res, next) {
        // check for basic auth header
        if (!req.headers.authorization) {
            return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Missing Authorization Header', null)
        }

        // verify auth credentials
        const base64Credentials =  req.headers.authorization.split(' ')[1]
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
        const [oid, password] = credentials.split(':')

        // Check if only empty authorization header was provided
        if (!oid) {
            return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Missing Credentials', null)
        }

         // Attach oid and password to locale
         res.locals.oid = oid
         res.locals.password = password

        // Check if item is registered locally
        isItemRegistered(oid).then(result => {
            if (!result) {
                // TODO enable check
                // return responseBuilder(HttpStatusCode.UNAUTHORIZED, res, 'Items not registered under this gateway', null)
                logger.warn(`Item ${oid} not registered under this gateway`)
                next()
            } else {
                next()
            }
        }).catch(err => {
            const error = errorHandler(err)
            logger.error(error.message)
            return responseBuilder(HttpStatusCode.INTERNAL_SERVER_ERROR, res, error.message)
        })
     } as basicAuthCtrl
 } 
