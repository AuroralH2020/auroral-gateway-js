import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()
if (
	!process.env.NODE_ENV || !process.env.IP
	|| !process.env.GTW_PORT || !process.env.XMPP_ENVIRONMENT
) {
	logger.error('Please provide valid .env configuration')
	process.exit()
}

export const Config = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	IP: process.env.IP!,
	PORT: process.env.GTW_PORT!,
	NM: {
		HOST: process.env.NM_HOST!,
		TIMEOUT: process.env.NM_TIMEOUT || 10000 // 10 sec
	},
	DLT: {
		HOST: process.env.DLT_HOST || 'http://auroralvm.dlt.iti.gr',
		PORT: process.env.DLT_PORT || 3000,
		MGMT_PORT: process.env.DLT_MGMT_PORT || 4002,
		ENABLED: process.env.DLT_ENABLED === 'true' ? true : false
	},
	TOKEN: {
		TTL: process.env.GTW_TOKEN_TTL || 86400, // 1 day
		REFRESH: process.env.GTW_TOKEN_REFRESH || 14400000 // 4h
	},
	GATEWAY: {
		ID: process.env.GTW_ID!,
		PASSWORD: process.env.GTW_PWD!
	},
	XMPP: {
		SERVICE: process.env.XMPP_SERVICE!,
		DOMAIN: process.env.XMPP_DOMAIN!,
		RESOURCE: process.env.XMPP_RESOURCE! || 'AuroralNode',
		ROSTER_REFRESH: process.env.ROSTER_REFRESH || 300000, // Defaults 5 min
		ENVIRONMENT: process.env.XMPP_ENVIRONMENT!,
		SIGN_MESSAGES: process.env.SIGN_MESSAGES || true
	},
	EVENTS: {
		SETTINGS_FILE: process.env.EVENT_SETTINGS_FILE || '/persistance/events.json',
	},
	AGENT: {
		IP: process.env.GTW_AGENT_HOST!, 
		PORT: process.env.GTW_AGENT_PORT!,
		TIMEOUT: process.env.GTW_AGENT_TIMEOUT || 10000 // 10 sec
	},
	DB: {
		HOST: process.env.DB_HOST!,
		PORT: process.env.DB_PORT!,
		PASSWORD: process.env.DB_PASSWORD!,
		CACHE_TTL: process.env.DB_CACHE_TTL! // Time to live of the values cached from the adapter
	}
}
