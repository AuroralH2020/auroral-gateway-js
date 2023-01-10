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
import { nm } from '../../src/connectors/nm-connector'
jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('test'))

// tested file
import { Token } from '../../src/core/nodeToken'
import { clients } from '../../src/core/xmpp'
import { MyError } from '../../src/utils'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('Security core', () => {
    it('Do start test', async () => {
        jest.spyOn(Token, 'start')
        await expect(Token.start()).toBeInstanceOf(Promise)
        await expect(Token.token).toBeUndefined()
        expect(Token.start).toHaveBeenCalledTimes(1)
    })
})
