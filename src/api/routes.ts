/**
 * routes.js
 * Administration router interface
 * Endpoint 'api'
 * User requests information about the system configuration and local infrastructure
 * @interface
 */
// Express router
import { Router } from 'express'
// Controllers
import * as ctrl from './controller' 

const ApiRouter = Router()

ApiRouter
.post('/initialize', ctrl.init)
.get('/start/:oid', ctrl.start)
.get('/roster/:oid', ctrl.roster)
.get('/stop/:oid', ctrl.stop)
.post('/message/:oid', ctrl.send)

export { ApiRouter }
