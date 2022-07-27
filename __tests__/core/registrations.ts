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
import { Registrations } from '../../src/core/registrations'
import { clients } from '../../src/core/xmpp'
import { MyError } from '../../src/utils'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('Registrations core', () => {
    it('Do start test', async () => {
        const spy = jest.spyOn(Registrations, 'start')
        jest.spyOn(nm, 'getAgentItems').mockResolvedValue({ message: ['123','223'] })
        expect(await Registrations.start()).toBeUndefined()
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('Do update test', async () => {
        const spy = jest.spyOn(Registrations, 'update')
        jest.spyOn(nm, 'getAgentItems').mockResolvedValue({ message: ['123','223'] })
        expect(await Registrations.update()).toBeUndefined()
        jest.spyOn(nm, 'getAgentItems').mockImplementation(
            () => { 
                throw new MyError('MOCKED ERROR') 
            })
        await expect(Registrations.update()).toBeDefined()
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do isItemRegistered test', async () => {
        const spy = jest.spyOn(Registrations, 'isItemRegistered')
        jest.spyOn(nm, 'getAgentItems').mockResolvedValue({ message: ['123','223'] })
        expect(await Registrations.isItemRegistered('123')).toBe(true)
        expect(await Registrations.isItemRegistered('12345')).toBe(false)
        expect(spy).toHaveBeenCalledTimes(2)
    })
})
