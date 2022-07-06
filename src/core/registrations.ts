import { Config } from '../config'
import { nm } from '../connectors/nm-connector'
import { logger, errorHandler } from '../utils'

class RegistrationsClass {
    private registrations: string[] = []
    private registrationsTimer: NodeJS.Timer | undefined = undefined

    public constructor () {
        this.registrationsTimer = setInterval(this.updateLocalRegistrations, Number(Config.TOKEN.REFRESH))   
    }

    // Preloads registrations info
    public async start () {
        await this.updateLocalRegistrations()
    }

    public async update() {
        await this.updateLocalRegistrations()
    }
    /**
     * Retrieves from NM all registered items under my Node
     * @returns registrations array
     */
    private async updateLocalRegistrations () {
        try {
            const response = await nm.getAgentItems(Config.GATEWAY.ID)
            logger.info('Updating registrations information...')
            // OIDS + AGID
            this.registrations = [...response.message, Config.GATEWAY.ID]
        } catch (err: unknown) {
            const error = errorHandler(err)
            logger.error('Updating registrations failed...' + error.message)
        }
    }

    /**
     * Check if the given oid is registered under my agent
     * @param oid Items oid
     * @returns true/false if the oid is registered
     */
    public async isItemRegistered (oid: string): Promise<boolean> {
        return this.registrations.includes(oid)
    }

 }

 export const Registrations = new RegistrationsClass()
