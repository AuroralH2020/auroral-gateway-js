import { logger } from '../utils'
import { nm } from '../connectors/nm-connector'

// Types
type nmCredentials = {
    token: string,
    refreshToken: string,
    exp: number
}

class NmTokenGenerator {
    private _token: string | undefined
    private _refreshToken: string | undefined
    private _exp: number | undefined
    private _ttl: number | undefined

    // Public methods

    public get token () {
        return this._token
    }

    public setCredentials (creds: nmCredentials) {
        this._token = creds.token
        this._refreshToken = creds.refreshToken
        this._exp = creds.exp
        this._ttl = (this._exp * 1000 - Date.now()) / 1000
        logger.info('Handshake successful, platform token stored and expiring in ' + this._ttl + ' seconds')
        // Refreshes token 5 min before expiration
        setTimeout(() => {
            this.refreshCredentials()
        }, (Number(this._ttl) - 300) * 1000)
    }

    // Private methods

    private async refreshCredentials () {
        const credentials = await nm.handshake()
        this.setCredentials(JSON.parse(credentials.message))
    }
}

export const nmToken = new NmTokenGenerator()
