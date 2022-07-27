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
import { nm } from '../../src/connectors/nm-connector'
jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('test'))

// tested file
import * as records from '../../src/core/records'
import { RecordStatusCode, RequestOperation } from '../../src/types/xmpp-types'
import { MyError } from '../../src/utils'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

beforeEach(() => {
})
afterEach(() => {    
    jest.clearAllMocks()
})

describe('Records core', () => {
    it('Do addRecord test', async () => {
        const spy = jest.spyOn(records, 'addRecord')
        await records.addRecord(RequestOperation.CANCELTASK,1,'source','dest', 'body',RecordStatusCode.MESSAGE_OK,true)
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('Do sendRecords test', async () => {
        const spy = jest.spyOn(records, 'sendRecords')
        await records.sendRecords()
        jest.spyOn(nm, 'postCounters').mockImplementation(
            () => {
                throw new MyError('MOCKED ERROR')
        })
        await expect(records.sendRecords()).toBeDefined()
        expect(spy).toHaveBeenCalledTimes(2)
    })
})
