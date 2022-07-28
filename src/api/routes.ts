/**
 * routes.js
 * Administration router interface
 * Endpoint 'api'
 * User requests information about the system configuration and local infrastructure
 * @interface
 */
// Express router
import { Router } from 'express'
// Middlewares
import { basicAuth } from './guard'
// Controllers
import { nm_ctrl, cs_ctrl } from './controllers'

const ApiRouter = Router()

ApiRouter

// AUTHENTICATION
.get('/objects/login', basicAuth(), cs_ctrl.start) // login
.get('/objects/logout', basicAuth(), cs_ctrl.stop) // logout

// RESOURCE CONSUMPTION
.get('/objects/:oid/properties/:pid', basicAuth(), cs_ctrl.getProperty) // cs_ctrl.getProperty) // getProperty
.put('/objects/:oid/properties/:pid', basicAuth(), cs_ctrl.putProperty) // cs_ctrl.putProperty) // putProperty

// CONSUMPTION - EVENTS
.get('/objects/:oid/events', basicAuth(), cs_ctrl.getEventChannels) // getObjectEventChannels 
.post('/events/:eid', basicAuth(), cs_ctrl.activateEventChannel) // activateEventChannel
.put('/events/:eid', basicAuth(), cs_ctrl.publishEventToChannel) // publishEvent
.delete('/events/:eid', basicAuth(), cs_ctrl.dectivateEventChannel) // deactivateEventChannel
.get('/objects/:oid/events/:eid', basicAuth(), cs_ctrl.eventChannelStatus) // statusRemoteEventChannel
.post('/objects/:oid/events/:eid', basicAuth(), cs_ctrl.subscribeToEventChannel) // subscribeRemoteEventChannel
.delete('/objects/:oid/events/:eid', basicAuth(), cs_ctrl.unsubscribeFromEventChannel) // unsubscribeRemoteEventChannel

// CONSUMPTION - ACTIONS
.get('/objects/:oid/actions', basicAuth(), nm_ctrl.dummy)
.get('/objects/:oid/actions/:aid', basicAuth(), nm_ctrl.dummy)
.post('/objects/:oid/actions/:aid', basicAuth(), nm_ctrl.dummy)
.get('/objects/:oid/actions/:aid/tasks/:tid', basicAuth(), nm_ctrl.dummy)
.delete('/objects/:oid/actions/:aid/tasks/:tid', basicAuth(), nm_ctrl.dummy)

// REGISTRATION
.get('/agents/:agid/objects', basicAuth(), nm_ctrl.getRegistrations) // getRegistrations
.post('/agents/:agid/objects',basicAuth(), nm_ctrl.postRegistrations) // postRegistrations
.put('/agents/:agid/objects', basicAuth(), nm_ctrl.updateRegistrations) // updateRegistration
.post('/agents/:agid/objects/delete', basicAuth(), nm_ctrl.removeRegistration) // removeRegistrations

// DISCOVERY
.get('/objects', basicAuth(), basicAuth(), cs_ctrl.roster)  // discovery gateway roster
.get('/discovery/nodes/organisation', basicAuth(), nm_ctrl.getNodesInMyOrganisation) // organisationNodes
.get('/discovery/nodes/organisation/:cid', basicAuth(), nm_ctrl.getNodesInOrganisation) 
.get('/discovery/nodes/community/:commid', basicAuth(), nm_ctrl.getNodesInCommunity) // communityNodes
.get('/discovery/items/organisation', basicAuth(), nm_ctrl.getItemsInMyOrganisation) // organisationItems
.get('/discovery/items/contract/:ctid', basicAuth(), nm_ctrl.getItemsInContract) // contractItems
.post('/objects/:oid', basicAuth(), cs_ctrl.discovery) // discoveryRemote
.get('/agents/cid/:reqid', basicAuth(), nm_ctrl.getCidFromReqid) // getCid
.get('/agents/partners', basicAuth(), nm_ctrl.getPartners) // getPartners
.get('/agents/communities/', basicAuth(), nm_ctrl.getCommunities) // getCommunities
.get('/agents/partner/:cid', basicAuth(), nm_ctrl.getPartner) // getPartnerInfo partners-> partner (agent compatible)

// SECURITY
.get('/security/privacy', basicAuth(), nm_ctrl.getAgentPrivacy) // getItemsPrivacy
.get('/security/contracts/:cid', basicAuth(), nm_ctrl.getContractedItemsByCid) // getContracts

export { ApiRouter }
