import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { Config } from '../config'
import { logger } from '../utils'

// Types
type JWTTokenClaims = {
    iss: string,
    aud: string,
    exp: number,
    iat: number
}

class TokenGenerator {
    private priv_cert: Buffer
    private pub_cert: Buffer
    private ASYNC_ALG: jwt.Algorithm = 'RS256'
    private aud: string = 'NM'
    private iss: string = Config.GATEWAY.ID
    private claims: JWTTokenClaims | undefined = undefined
    private _token: string | undefined
    private refreshTimer: NodeJS.Timer | undefined = undefined

    public constructor () {
        // Load Keys
        try {
            this.priv_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/keystore/gateway-key.pem'))
            this.pub_cert = fs.readFileSync(path.join(Config.HOME_PATH, '/keystore/gateway-pubkey.pem'))
        } catch (err) {
            logger.error('Please generate keys before using the Gateway')
            process.exit(0)
        }
    }

    // Public methods

    public start () {
        // Define token claims
        return new Promise((resolve, _reject) => {
            this.claims = {
                iss: this.iss,
                aud: this.aud,
                exp: Math.floor(Date.now() / 1000) + Number(Config.TOKEN.TTL),
                iat: Math.floor(Date.now() / 1000)
            }
            this.createToken((token) => {
                this._token = token
                // Set up token refresh 
                this.refreshTimer = setInterval(() => {
                    this.refreshToken()
                }, Number(Config.TOKEN.REFRESH))
                logger.info('Token was created')
                resolve(true)
            })
        })
    }

    public get token () {
        return this._token
    }

    // Private methods

    private createToken (callback: (token: string) => void) {
        jwt.sign(
            this.claims as JWTTokenClaims,
            this.priv_cert,
            { algorithm: this.ASYNC_ALG },
            (err: Error | null, token?: string) => {
                if (err) {
                    logger.error(err.message)
                    process.exit(1)
                } else if (token) {
                    callback(token)
                } else {
                    logger.error('Token was not created...')
                    process.exit(1)
                }
            })
    }

    private refreshToken () {
        this.claims = {
            iss: this.iss,
            aud: this.aud,
            exp: Math.floor(Date.now() / 1000) + Number(Config.TOKEN.TTL),
            iat: Math.floor(Date.now() / 1000)
        }
        this.createToken((token) => {
            this._token = token
            logger.info('Token was refreshed')
        })
    }

}

export const Token = new TokenGenerator()
