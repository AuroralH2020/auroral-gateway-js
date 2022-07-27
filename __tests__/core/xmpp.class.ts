/* eslint-disable import/newline-after-import */
/* eslint-disable import/order */
/* eslint-disable import/first */
jest.mock('got')
jest.mock('fs')
jest.mock('../../src/utils/logger')
jest.mock('../../src/config')
jest.mock('@xmpp/client')
jest.useFakeTimers()
jest.spyOn(global, 'setInterval')

import fs from 'fs'
import { agent } from '../../src/connectors/agent-connector'
import { nm } from '../../src/connectors/nm-connector'
import * as xmppClient from '@xmpp/client'
jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('test'))
jest.spyOn(xmppClient, 'client').mockReturnValue({ on: () => {}, start: async () => {} })
// tested file
import { XMPP } from '../../src/core/xmpp.class'
import * as xmpp from '../../src/core/xmpp'
import { MyError } from '../../src/utils'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('xmpp.class core', () => {
    it('Do start test', async () => {
        const testXmpp = new XMPP('oid', 'pwd')

        // jest.spyOn(XMPP,'start')
        const test = await testXmpp.start()
    })
})
