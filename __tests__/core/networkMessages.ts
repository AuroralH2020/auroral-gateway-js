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
import * as networkMessages from '../../src/core/networkMessages'
import { clients } from '../../src/core/xmpp'
import { XMPP } from '../../src/core/xmpp.class'
import { RecordStatusCode, RequestOperation } from '../../src/types/xmpp-types'
import { MyError } from '../../src/utils'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

const sendStanza = (a: any, b:any, c:any, d:any, e: any, f: any, callback:Function) => {
    callback(false, { 'test': true })
}
const sendStanzaErr = (a: any, b:any, c:any, d:any, e: any, f: any, callback:Function) => {
    callback(true, { error: 'MOCKER ERROR', status: 404 })
}

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('NetworkMessages core', () => {
    it('Do addSubscriberNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'addSubscriberNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.addSubscriberNetwork('oid','eid','oid2')).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.addSubscriberNetwork('oid','eid','oid2')).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.addSubscriberNetwork('oid','eid','oid2')).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(3)
    })
    it('Do getPropertyNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'getPropertyNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.getPropertyNetwork('oid','pid','oid2',{})).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.getPropertyNetwork('oid','pid','oid2',{})).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.getPropertyNetwork('oid','pid','oid2',{})).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(3)
    })
    it('Do putPropertyNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'putPropertyNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.putPropertyNetwork('oid','pid','oid2',{},{})).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.putPropertyNetwork('oid','pid','oid2',{},{})).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.putPropertyNetwork('oid','pid','oid2',{},{})).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(3)
    })
    it('Do removeSubscriberNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'removeSubscriberNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.removeSubscriberNetwork('oid','eid','oid2')).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.removeSubscriberNetwork('oid','eid','oid2')).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.removeSubscriberNetwork('oid','eid','oid2')).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(3)
    })
    it('Do getEventChannelStatusNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'getEventChannelStatusNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.getEventChannelStatusNetwork('oid','eid','oid2')).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.getEventChannelStatusNetwork('oid','eid','oid2')).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.getEventChannelStatusNetwork('oid','eid','oid2')).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(3)
    })
    it('Do sendEventNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'sendEventNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.sendEventNetwork('oid','eid','oid2',{})).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.sendEventNetwork('oid','eid','oid2',{})).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.sendEventNetwork('oid','eid','oid2',{})).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(3)
    })
    it('Do getObjectInfoNetwork test', async () => {
        const spy = jest.spyOn(networkMessages, 'getObjectInfoNetwork')
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        expect(await networkMessages.getObjectInfoNetwork('oid','oid2')).toMatchObject({ test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanza } as any as XMPP)
        await networkMessages.getObjectInfoNetwork('oid','oid2', { test: true })
        jest.spyOn(clients, 'get').mockReturnValue({ sendStanza: sendStanzaErr } as any as XMPP)
        await expect(networkMessages.getObjectInfoNetwork('oid','oid2')).rejects.toBeDefined()
        jest.spyOn(clients, 'get').mockReturnValue(undefined)
        await expect(networkMessages.getObjectInfoNetwork('oid','oid2')).rejects.toBeDefined()
        expect(spy).toHaveBeenCalledTimes(4)
    })
})
