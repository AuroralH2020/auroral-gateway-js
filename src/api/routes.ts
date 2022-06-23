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

// AUTHENTICATION
.get('/objects/login', ctrl.dummy) // login
.get('/objects/logout', ctrl.dummy) // logout

// RESOURCE CONSUMPTION
.get('/objects/:oid/properties/:pid', ctrl.dummy) // getProperty
.put('/objects/:oid/properties/:pid', ctrl.dummy) // putProperty

// CONSUMPTION - EVENTS
.get('/objects/:oid/events', ctrl.dummy) // getObjectEventChannels
.post('/events/:eid', ctrl.dummy) // activateEventChannel
.put('/events/:eid', ctrl.dummy) // publishEvent
.delete('/events/:eid', ctrl.dummy) // deactivateEventChannel
.get('/objects/:oid/events/:eid', ctrl.dummy) // statusRemoteEventChannel
.post('/objects/:oid/events/:eid', ctrl.dummy) // subscribeRemoteEventChannel
.delete('/objects/:oid/events/:eid', ctrl.dummy) // unsubscribeRemoteEventChannel

// CONSUMPTION - ACTIONS
.get('/objects/:oid/actions', ctrl.dummy)
.get('/objects/:oid/actions/:aid', ctrl.dummy)
.post('/objects/:oid/actions/:aid', ctrl.dummy)
.get('/objects/:oid/actions/:aid/tasks/:tid', ctrl.dummy)
.delete('/objects/:oid/actions/:aid/tasks/:tid', ctrl.dummy)

// REGISTRATION
.get('/agents/:agid/objects', ctrl.dummy) // getRegistrations
.post('/agents/:agid/objects', ctrl.dummy) // postRegistrations
.put('/agents/:agid/objects', ctrl.dummy) // updateRegistration
.post('/agents/:agid/objects/delete', ctrl.dummy) // removeRegistrations

// DISCOVERY
.get('/objects', ctrl.dummy)  // discovery
.get('/discovery/nodes/organisation', ctrl.dummy) // organisationNodes
.get('/discovery/nodes/community/:commid', ctrl.dummy) // communityNodes
.get('/discovery/items/organisation', ctrl.dummy) // organisationItems
.get('/discovery/items/contract/:ctid', ctrl.dummy) // contractItems
.post('/objects/:oid', ctrl.dummy) // discoveryRemote
.get('/agents/:cid/:reqid', ctrl.dummy) // getCid
.get('/agents/partners', ctrl.dummy) // getPartners
.get('/agents/communities/', ctrl.dummy) // getCommunities
.get('/agents/partners/:cid', ctrl.dummy) // getPartnerInfo

// SECURITY
.get('/security/relationship/:rid', ctrl.dummy) // getRelationship
.get('/security/privacy', ctrl.dummy) // getItemsPrivacy
.get('/security/contracts/:cid', ctrl.dummy) // getContracts

// HEALTHCHECK
.get('/objects/login', ctrl.dummy) 

// UNUSED
// .get('/objects/:oid/properties', ctrl.dummy)
// .put('/agents/:agid/objects/update', ctrl.dummy)
// .get('/discovery/nodes/organisation/:cid', ctrl.dummy)

export { ApiRouter }
