/* eslint-disable import/order */
/* eslint-disable import/first */
jest.mock('got')
import { agent } from '../../src/connectors/agent-connector'
import got from '../../__mocks__/got'

beforeEach(() => {
    got.__notFail()
})

afterEach(() => {    
    jest.clearAllMocks()
})

describe('agent-connector', () => {
    it('Do getProperty', async () => {
        const spy = jest.spyOn(agent, 'getProperty')
        const response = await agent.getProperty('sourceoid', 'pid', 'oid', {})
        expect(response).toMatch('test')
        got.__toFail()
        await expect(agent.getProperty('sourceoid', 'pid', 'oid',{})).rejects.toMatchObject({ 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 })
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do putProperty', async () => {
        const spy = jest.spyOn(agent, 'putProperty')
        const response = await agent.putProperty('sourceoid', 'pid', 'oid', { test: 'ok' },{})
        expect(response).toMatch('test')
        got.__toFail()
        await expect(agent.putProperty('sourceoid', 'pid', 'oid', { test: 'ok' },{})).rejects.toMatchObject({ 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 })
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do putEvent', async () => {
        const spy = jest.spyOn(agent, 'putEvent')
        const response = await agent.putEvent('sourceoid', 'destinationOid', 'eid', { test: 'ok' })
        expect(response).toMatch('test')
        got.__toFail()
        await expect(agent.putEvent('sourceoid', 'destinationOid', 'eid', { test: 'ok' })).rejects.toMatchObject({ 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 400 })
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do discovery', async () => {
        const spy = jest.spyOn(agent, 'discovery')
        const response = await agent.discovery('sourceoid', 'destinationOid', { test: 'ok' })
        expect(response).toMatch('test')
        got.__toFail()
        await expect(agent.discovery('sourceoid', 'destinationOid', { test: 'ok' })).rejects.toMatchObject({ 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 400 })
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do notify', async () => {
        const spy = jest.spyOn(agent, 'notify')
        const response = await agent.notify('sourceoid', 'destinationOid', 'nid', { test: 'ok' })
        expect(response).toMatch('test')
        got.__toFail()
        await expect(agent.notify('sourceoid', 'destinationOid', 'nid', { test: 'ok' })).rejects.toMatchObject({ 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 400 })
        expect(spy).toHaveBeenCalledTimes(2)
    })
})
