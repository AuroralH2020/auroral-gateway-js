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
import { nm_ctrl, cs_ctrl } from './controllers' 

const ApiRouter = Router()

ApiRouter
.post('/initialize', cs_ctrl.init)
.get('/start/:oid', cs_ctrl.start)
.get('/roster/:oid', cs_ctrl.roster)
.get('/stop/:oid', cs_ctrl.stop)
.post('/message/:oid', cs_ctrl.send)

// AUTHENTICATION
.get('/objects/login', nm_ctrl.dummy) // login
.get('/objects/logout', nm_ctrl.dummy) // logout

// RESOURCE CONSUMPTION
.get('/objects/:oid/properties/:pid', nm_ctrl.dummy) // getProperty
.put('/objects/:oid/properties/:pid', nm_ctrl.dummy) // putProperty

// CONSUMPTION - EVENTS
.get('/objects/:oid/events', nm_ctrl.dummy) // getObjectEventChannels
.post('/events/:eid', nm_ctrl.dummy) // activateEventChannel
.put('/events/:eid', nm_ctrl.dummy) // publishEvent
.delete('/events/:eid', nm_ctrl.dummy) // deactivateEventChannel
.get('/objects/:oid/events/:eid', nm_ctrl.dummy) // statusRemoteEventChannel
.post('/objects/:oid/events/:eid', nm_ctrl.dummy) // subscribeRemoteEventChannel
.delete('/objects/:oid/events/:eid', nm_ctrl.dummy) // unsubscribeRemoteEventChannel

// CONSUMPTION - ACTIONS
.get('/objects/:oid/actions', nm_ctrl.dummy)
.get('/objects/:oid/actions/:aid', nm_ctrl.dummy)
.post('/objects/:oid/actions/:aid', nm_ctrl.dummy)
.get('/objects/:oid/actions/:aid/tasks/:tid', nm_ctrl.dummy)
.delete('/objects/:oid/actions/:aid/tasks/:tid', nm_ctrl.dummy)

// REGISTRATION
.get('/agents/:agid/objects', nm_ctrl.getRegistrations) // getRegistrations
.post('/agents/:agid/objects', nm_ctrl.postRegistrations) // postRegistrations
.put('/agents/:agid/objects', nm_ctrl.updateRegistrations) // updateRegistration
.post('/agents/:agid/objects/delete', nm_ctrl.removeRegistration) // removeRegistrations

// DISCOVERY
.get('/objects', nm_ctrl.dummy)  // discovery 
.get('/discovery/nodes/organisation', nm_ctrl.getNodesInMyOrganisation) // organisationNodes
.get('/discovery/nodes/community/:commid', nm_ctrl.getNodesInCommunity) // communityNodes
.get('/discovery/items/organisation', nm_ctrl.getItemsInMyOrganisation) // organisationItems
.get('/discovery/items/contract/:ctid', nm_ctrl.getItemsInContract) // contractItems
.post('/objects/:oid', nm_ctrl.dummy) // discoveryRemote
.get('/agents/cid/:reqid', nm_ctrl.getCidFromReqid) // getCid
.get('/agents/partners', nm_ctrl.getPartners) // getPartners
.get('/agents/communities/', nm_ctrl.getCommunities) // getCommunities
.get('/agents/partners/:cid', nm_ctrl.getPartner) // getPartnerInfo

// SECURITY
.get('/security/privacy', nm_ctrl.getAgentPrivacy) // getItemsPrivacy
.get('/security/contracts/:cid', nm_ctrl.getContractedItemsByCid) // getContracts

// HEALTHCHECK
.get('/objects/login', nm_ctrl.dummy) 

// UNUSED
// .get('/objects/:oid/properties', ctrl.dummy)
// .put('/agents/:agid/objects/update', ctrl.dummy)
// .get('/discovery/nodes/organisation/:cid', ctrl.dummy)
// .get('/security/relationship/:rid', nm_ctrl.dummy) 

export { ApiRouter }
