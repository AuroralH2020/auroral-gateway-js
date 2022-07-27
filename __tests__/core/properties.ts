/* eslint-disable import/newline-after-import */
/* eslint-disable import/order */
/* eslint-disable import/first */
jest.mock('got')
jest.mock('fs')
jest.mock('../../src/utils/logger')
jest.mock('../../src/config')
jest.useFakeTimers()
jest.spyOn(global, 'setInterval')

import fs from 'fs'
import { agent } from '../../src/connectors/agent-connector'
jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('test'))

// tested file
import * as properties from '../../src/core/properties'
import { clients } from '../../src/core/xmpp'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('Properties core', () => {
    it('Do getPropertyLocaly test', async () => {
        const spy = jest.spyOn(properties, 'getPropertyLocaly')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        jest.spyOn(agent, 'getProperty').mockResolvedValue({ message: { test: 'ok' } })
        expect(await properties.getPropertyLocaly('oid1','pid','oid2',{})).toMatchObject({ success: true, body: { test: 'ok' } })
        jest.spyOn(clients, 'has').mockReturnValue(false)
        expect(await properties.getPropertyLocaly('oid1','pid','oid2',{})).toMatchObject({ success: false, body: {} })
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do putPropertyLocaly test', async () => {
        const spy = jest.spyOn(properties, 'putPropertyLocaly')
        jest.spyOn(clients, 'has').mockReturnValue(true)
        jest.spyOn(agent, 'putProperty').mockResolvedValue({ message: { test: 'ok' } })
        expect(await properties.putPropertyLocaly('oid1','pid','oid2',{},{})).toMatchObject({ success: true, body: { test: 'ok' } })
        jest.spyOn(clients, 'has').mockReturnValue(false)
        expect(await properties.putPropertyLocaly('oid1','pid','oid2',{}, {})).toMatchObject({ success: false, body: {} })
        expect(spy).toHaveBeenCalledTimes(2)
    })
})
