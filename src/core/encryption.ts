import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { redisDb } from '../persistance/redis'
import { Config } from '../config'
import { nm } from '../connectors/nm-connector'
import { HttpStatusCode, errorHandler, logger, MyError } from '../utils'

const mode = 'sha256'

const privateKey = fs.readFileSync(path.join(Config.HOME_PATH, '/persistance/keystore/gateway-key.pem')).toString('utf8')

export async function signMessage(message: string): Promise<string> {
    try {
        logger.debug('Signing message...')
        return crypto.sign(mode, Buffer.from(message), {
            key: privateKey,
            padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          }).toString('base64')
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to sign...', HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}

export async function validateMessage(oid: string, message: string, signature: string): Promise<boolean> {
    try {
        logger.debug('Validating message signature...')
        const agid = await getAgid(oid)
        const pubkey = await getPubkey(agid)
        return crypto.verify(
            mode,
            Buffer.from(message),
            {
              key: pubkey,
              padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            },
            Buffer.from(signature, 'base64')
        )
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to validate message...', HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}

export async function encryptWithRemotePublicKey(oid: string, message: string): Promise<string> {
    const agid = await getAgid(oid)
    const pubkey = await getPubkey(agid)
    return encrypt(pubkey, message, false)
}

export async function encryptWithMyPrivateKey(message: string): Promise<string> {
    return encrypt(privateKey, message, true)
}

export async function decryptWithMyPrivateKey(message: string): Promise<string> {
    return decrypt(privateKey, message, true)
}

export async function decryptWithRemotePublicKey(oid: string, message: string): Promise<string> {
    const agid = await getAgid(oid)
    const pubkey = await getPubkey(agid)
    return decrypt(pubkey, message, false)
}

// private
function decrypt(key: string, message: string, usePrivateKey: boolean): string {
    try {
        if (usePrivateKey) {
            return crypto.privateDecrypt(
                {
                  key: key,
                  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                  oaepHash: 'sha256',
                },
                Buffer.from(message)
              ).toString('base64')
        } else {
            return crypto.publicDecrypt(
                {
                  key: key,
                  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                  oaepHash: 'sha256',
                },
                Buffer.from(message)
              ).toString('base64')
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to decrypt: ' + error.message, HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}

function encrypt(key: string, message: string, usePrivateKey: boolean): string {
    try {
        if (usePrivateKey) {
            return crypto.privateEncrypt(
                {
                  key: key,
                  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                  oaepHash: 'sha256',
                },
                Buffer.from(message)
              ).toString('base64')
        } else {
            return crypto.publicEncrypt(
                {
                  key: key,
                  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                  oaepHash: 'sha256',
                },
                Buffer.from(message)
              ).toString('base64')
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to encrypt: ' + error.message, HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}

async function getPubkey(agid: string): Promise<string> {
    try {
        let pubkey = await redisDb.get('pubkey' + agid)
        if (!pubkey) {
            logger.debug('Getting pubkey from NM')
            pubkey = (await nm.getPubkey(agid)).message
            redisDb.set('pubkey' + agid, pubkey, 60 * 60 * 24 * 7) // One week
        }
        return pubkey
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to get pubkey...', HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}

async function getAgid(oid: string): Promise<string> {
    try {
        let agid = await redisDb.get('agid' + oid)
        if (!agid) {
            logger.debug('Getting agid from NM')
            agid = (await nm.getAgidByOid(oid)).message
            redisDb.set('agid' + oid, agid, 60 * 60 * 24 * 7) // One week
        }
        return agid
    } catch (err) {
        const error = errorHandler(err)
        logger.error('Failed to get agid...', HttpStatusCode.BAD_REQUEST)
        throw new MyError(error.message)
    }
}
