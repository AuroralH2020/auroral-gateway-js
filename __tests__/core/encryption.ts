/* eslint-disable import/newline-after-import */
/* eslint-disable import/order */
/* eslint-disable import/first */
jest.mock('got')
jest.mock('crypto')
jest.mock('redis')
jest.mock('fs')
jest.mock('../../src/utils/logger')
jest.mock('../../src/config')


import fs from 'fs'
import crypto from 'crypto'
jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('test'))

import * as encryption from '../../src/core/encryption'
import { MyError } from '../../src/utils'
import { redisDb } from '../../src/persistance/redis'

const errorMessage = { 'message': 'MOCKED ERROR', 'stack': undefined, 'status': 500 }

afterEach(() => {    
    jest.clearAllMocks()
})

describe('encryption core', () => {
    it('Do signMessage', async () => {
        jest.spyOn(crypto, 'sign').mockImplementation(
            (a, b) => {
                return Buffer.from('asd')
        })
        const spy = jest.spyOn(encryption, 'signMessage')
        const response = await encryption.signMessage('message')
        jest.spyOn(crypto, 'sign').mockImplementation(
            (a, b) => {
                throw new MyError('MOCKED ERROR')
        })
        await expect(encryption.signMessage('message')).rejects.toMatchObject(errorMessage)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do validateMessage', async () => {
        const spy = jest.spyOn(encryption, 'validateMessage')
    
        jest.spyOn(redisDb, 'get').mockResolvedValue(null)
        const response2 = await encryption.validateMessage('oid', 'message', 'signature')
        expect(response2).toBeUndefined()
        jest.spyOn(crypto, 'verify').mockImplementation(
            (a, b) => {
                throw new MyError('MOCKED ERROR')
        })
        //  getAgid fail
        await expect(encryption.validateMessage('oid', 'message', 'signature')).rejects.toMatchObject(errorMessage)
        jest.spyOn(redisDb, 'set').mockImplementationOnce(
            (a, b) => {
                throw new MyError('MOCKED ERROR')
        })
        await expect(encryption.validateMessage('oid', 'message', 'signature')).rejects.toMatchObject(errorMessage)
        //  getPubkey fail
        jest.spyOn(redisDb, 'set').mockImplementationOnce(
            async(a: string, b:string) => {
                return true
        })
        jest.spyOn(redisDb, 'set').mockImplementationOnce(
            (a, b) => {
                throw new MyError('MOCKED ERROR')
        })
        await expect(encryption.validateMessage('oid', 'message', 'signature')).rejects.toMatchObject(errorMessage)
        // expect(spy).toHaveBeenCalledTimes(5)
    })
    it('Do encryptWithRemotePublicKey', async () => {
        const spy = jest.spyOn(encryption, 'encryptWithRemotePublicKey')
        jest.spyOn(crypto, 'publicEncrypt').mockReturnValue(Buffer.from('asd'))
        const response = await encryption.encryptWithRemotePublicKey('oid', 'message')
        expect(response).toBeDefined()
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('Do encryptWithMyPrivateKey', async () => {
        const spy = jest.spyOn(encryption, 'encryptWithMyPrivateKey')
        jest.spyOn(crypto, 'privateEncrypt').mockReturnValue(Buffer.from('asd'))
        const response = await encryption.encryptWithMyPrivateKey('message')
        expect(response).toBeDefined()
        jest.spyOn(crypto, 'privateEncrypt').mockImplementation(
            (a, b) => {
                throw new MyError('MOCKED ERROR')
        })
        await expect(encryption.encryptWithMyPrivateKey('message')).rejects.toMatchObject(errorMessage)
        expect(spy).toHaveBeenCalledTimes(2)
    })
    it('Do decryptWithMyPrivateKey', async () => {
        const spy = jest.spyOn(encryption, 'decryptWithMyPrivateKey')
        jest.spyOn(crypto, 'privateDecrypt').mockReturnValue(Buffer.from('asd'))
        const response = await encryption.decryptWithMyPrivateKey('message')
        expect(response).toBeDefined()
        expect(spy).toHaveBeenCalledTimes(1)
    })
    it('Do decryptWithRemotePublicKey', async () => {
        const spy = jest.spyOn(encryption, 'decryptWithRemotePublicKey')
        jest.spyOn(crypto, 'publicDecrypt').mockReturnValue(Buffer.from('asd'))
        const response = await encryption.decryptWithRemotePublicKey('oid','message')
        expect(response).toBeDefined()
        jest.spyOn(crypto, 'publicDecrypt').mockImplementation(
            (a, b) => {
                throw new MyError('MOCKED ERROR')
        })
        await expect(encryption.decryptWithRemotePublicKey('oid', 'message')).rejects.toMatchObject(errorMessage)
        expect(spy).toHaveBeenCalledTimes(2)
    })

})
