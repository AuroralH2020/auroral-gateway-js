/* eslint-disable import/newline-after-import */
/* eslint-disable import/order */
/* eslint-disable import/first */
jest.mock('got')
jest.mock('crypto')
jest.mock('redis')
jest.mock('fs')
jest.mock('../../src/utils/logger')
jest.mock('../../src/config')
jest.useFakeTimers()
jest.spyOn(global, 'setInterval')

import fs from 'fs'
jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('test'))

// tested file
import { events } from '../../src/core/events'
import { clients } from '../../src/core/xmpp'
import { XMPP } from '../../src/core/xmpp.class'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('Events core', () => {
    it('Do createEventChannel test', async () => {
        const spy = jest.spyOn(events, 'createEventChannel')

        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        const response = events.createEventChannel('oid', 'eid')
        expect(response).toBe(undefined)

        jest.spyOn(clients, 'get').mockReturnValueOnce(undefined)
        expect(() => {
            events.createEventChannel('oid', 'eid')
          }).toThrow()
       
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do removeEventChannel test', async () => {
        const spy = jest.spyOn(events, 'removeEventChannel')

        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        jest.spyOn(clients, 'has').mockReturnValue(true)
        const response = events.removeEventChannel('oid', 'eid')
        expect(response).toBe(undefined)
        jest.spyOn(clients, 'has').mockReturnValueOnce(false)
        expect(() => {
            events.removeEventChannel('oid', 'eid')
          }).toThrow()
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do getEventChannelsNames test', async () => {
        const spy = jest.spyOn(events, 'getEventChannelsNames')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        const response = events.getEventChannelsNames('oid')
        expect(response).toMatchObject([])
        jest.spyOn(clients, 'has').mockReturnValueOnce(false)
        expect(() => {
            events.getEventChannelsNames('oid')
          }).toThrow()
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do getSubscribers test', async () => {
        const spy = jest.spyOn(events, 'getSubscribers')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        const response = events.getSubscribers('oid', 'eid')
        expect(response).toMatchObject([])
        jest.spyOn(clients, 'has').mockReturnValueOnce(false)
        expect(() => {
            events.getSubscribers('oid', 'eid')
          }).toThrow()
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do addSubscriber test', async () => {
        const spy = jest.spyOn(events, 'addSubscriber')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        events.createEventChannel('oid', 'eid')
        const response = events.addSubscriber('oid', 'eid', 'jid')
        expect(response).toBeDefined()
        jest.spyOn(clients, 'has').mockReturnValue(false)
        expect(events.addSubscriber('oid', 'eid', 'jid')).toMatchObject({ success: false, body: {} })
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do removeSubscriber test', async () => {
        const spy = jest.spyOn(events, 'removeSubscriber')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        events.createEventChannel('oid', 'eid')
        events.addSubscriber('oid', 'eid', 'jid')
        const response = events.removeSubscriber('oid', 'eid', 'jid')
        expect(response).toBeDefined()
        jest.spyOn(clients, 'has').mockReturnValue(false)
        expect(events.removeSubscriber('oid', 'eid', 'jid')).toMatchObject({ success: false, body: {} })
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do channelStatus test', async () => {
        const spy = jest.spyOn(events, 'channelStatus')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        events.createEventChannel('oid', 'eid')
        const response = events.channelStatus('oid', 'eid','sourceId')
        expect(response).toBeDefined()
        jest.spyOn(clients, 'has').mockReturnValue(false)
        expect(events.channelStatus('oid', 'eid','sourceId')).toMatchObject({ success: false, body: {} })
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do sendEvent test', async () => {
        const spy = jest.spyOn(events, 'sendEvent')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        events.createEventChannel('oid', 'eid')
        const response = events.sendEvent('sourceId', 'oid', 'eid', {})
        expect(response).toBeDefined()
        jest.spyOn(clients, 'has').mockReturnValue(false)
        expect(events.sendEvent('sourceId', 'oid', 'eid', {})).toMatchObject({ success: false, body: {} })
        jest.spyOn(clients, 'get').mockReturnValue({} as any as XMPP)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do storeEventChannelsToFile test', async () => {
        const spy = jest.spyOn(events, 'storeEventChannelsToFile')
        const response = events.storeEventChannelsToFile()
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('Do loadEventChannelsFromFile test', async () => {
        const spy = jest.spyOn(events, 'loadEventChannelsFromFile')
        const response = events.loadEventChannelsFromFile()
        expect(spy).toHaveBeenCalledTimes(1)
    })
})
