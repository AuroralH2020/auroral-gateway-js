import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { v4 } from 'uuid'
import { Config } from '../config'
import { HttpStatusCode, logger, MyError } from '../utils'
import { getPubkey } from './encryption'
import { clients } from './xmpp'

// Types
type JWTTokenClaims = {
    iss: string,
    aud: string,
    exp: number,
    iat: number
    sourceOid: string,
    oid: string,
    pid: string,
    sourceAgid: string,
    requestId: string
}

class HttpTokenGenerator {
    private priv_cert: Buffer
    private pub_cert: Buffer
    private ASYNC_ALG: jwt.Algorithm = 'RS256'
    private aud: string = 'NM'
    private iss: string = Config.GATEWAY.ID
    // private claims: JWTTokenClaims | undefined = undefined
    private _token: string | undefined

    public constructor () {
        // Load Keys
        try {
            this.priv_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/persistance/keystore/gateway-key.pem'))
            this.pub_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/persistance/keystore/gateway-pubkey.pem'))
        } catch (err) {
            logger.error('Please generate keys before using the Gateway')
            process.exit(0)
        }
    }

    public generateToken(sourceOid: string, oid: string, pid: string) : string {
        // Define token claims
        const token = jwt.sign(
            {
                iss: this.iss,
                aud: this.aud,
                exp: Math.floor(Date.now() / 1000) + Number(Config.TOKEN.TTL),
                iat: Math.floor(Date.now() / 1000),
                sourceOid: sourceOid,
                sourceAgid: this.iss,
                oid: oid,
                pid: pid,
                requestId: v4()
            },
            this.priv_cert,
            { algorithm: this.ASYNC_ALG }
        )
        return token
    }

    public async verifyToken(token: string) : Promise<{ sourceOid: string; oid: string; pid: string, requestId: string} > {
        // extract senders agid to retrieve its public key
        const unverifiedDecoded = jwt.decode(token)  as JWTTokenClaims
        if (!unverifiedDecoded) {
            throw new MyError('Token is not valid, returning 401...', HttpStatusCode.UNAUTHORIZED)
        }
        // load public key
        const remote_pubkey = await getPubkey(unverifiedDecoded.sourceAgid)
        // remove Bearer from token
        // verify token and return claims
        const decoded = jwt.verify(token, remote_pubkey, { algorithms: [this.ASYNC_ALG] }) as JWTTokenClaims
        logger.debug(`Token verified for ${decoded.oid}`)
        return { sourceOid: decoded.sourceOid, oid: decoded.oid, pid: decoded.pid, requestId: decoded.requestId }
    }
}

const HttpToken = new HttpTokenGenerator()

// Public functionality

export const authenticate = async (token: string): Promise<void> => {
    const decoded = await HttpToken.verifyToken(token)
    const xmpp = clients.get(decoded.oid)
    if (xmpp) {
        // TBD Get the origin of the request from KAFKA or XMPP, to do the origin tampering verification
        // TBD Replace second origin source OID accordingly
        const jid = await xmpp.verifySender(`${decoded.sourceOid}@${Config.XMPP.DOMAIN}`, `${decoded.sourceOid}@${Config.XMPP.DOMAIN}`)
        if (!jid) {
            throw new MyError('Sender is not in roster, returning 401...', HttpStatusCode.UNAUTHORIZED)
        }
        // TBD Add to counters
    } else {
        throw new MyError('Receiveing Object is not connected to the XMPP network, aborting...', HttpStatusCode.LOCKED)
    }
}

export const getJwt = async (sourceoid: string, oid: string, pid: string) => {
    const xmpp = clients.get(sourceoid)
    if (xmpp) {
        const jid = await xmpp.verifyReceiver(oid)
        if (jid) {
            return HttpToken.generateToken(sourceoid, oid, pid)
            // TBD Add to counters
        }
        throw new MyError('Receiveing Object is not connected in roster, returning 401...', HttpStatusCode.UNAUTHORIZED)
    } else {
        throw new MyError('Receiveing Object is not connected to the XMPP network, resource locked...', HttpStatusCode.LOCKED)
    }
}
