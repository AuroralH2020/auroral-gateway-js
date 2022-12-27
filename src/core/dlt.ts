import crypto from 'crypto'
import { dltMgmt } from '../connectors/dlt-connector'
import { nm } from '../connectors/nm-connector'
import { DltUser } from '../types/dlt-types'
import { Config } from '../config'
import { logger, errorHandler, HttpStatusCode, MyError } from '../utils'

export const initializeDlt = async () => {
    try {
        const user = await dltMgmt.getUser(Config.GATEWAY.ID.substring(0,23) + '@auroral.eu')
        if (user) {
            dltUser.initialize(user)
            logger.info('DLT user active, initialization finalised successfully!')
        } else {
            const cid = (await nm.getCidFromReqid(Config.GATEWAY.ID)).message as unknown as string
            const user = await dltMgmt.createUser({
                username: Config.GATEWAY.ID,
                email: Config.GATEWAY.ID.substring(0,23) + '@auroral.eu',
                password: crypto.randomBytes(8).toString('hex'),
                attributes: {
                    cid
                }
            })
            if (user) {
                await dltMgmt.validateUser(user.email)
                dltUser.initialize(user)
                logger.info('DLT user created, initialization finalised successfully!')
            } else {
                logger.info('DLT user active, initialization finalised successfully!')
            }
        }
    } catch (err) {
        const error = errorHandler(err)
        logger.error('DLT initialized with errors...')
    }
}

class DltClass {
    public id: string | undefined
    public username: string | undefined
    public email: string | undefined
    public createdTimestamp: number | undefined
    public cid: string | undefined
    private _enabled: boolean

    constructor () {
        this._enabled = false
    }

    public initialize = (user: DltUser) => {
        this.id = user.id
        this.username = user.username
        this.email = user.email
        this.createdTimestamp = user.createdTimestamp
        this.cid = user.attributes.cid
        this._enabled = user.enabled
    }

}

export const dltUser = new DltClass()
