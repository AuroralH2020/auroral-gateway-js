/** 
 * GUARD MIDDLEWARE
 * Extracts user and password from credentials
 */
 import { expressTypes } from '../types/index'
 import { responseBuilder } from '../utils/response-builder'
 import { HttpStatusCode } from '../utils/http-status-codes'

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

        next()
     } as basicAuthCtrl
 } 
