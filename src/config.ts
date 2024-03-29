import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

if (process.env.NODE_ENV === 'test') {
	logger.debug('Using test configuration...')
} else if (
	!process.env.NODE_ENV || !process.env.IP
	|| !process.env.GTW_PORT || !process.env.XMPP_ENVIRONMENT
) {
	logger.error('Please provide valid .env configuration')
	process.exit()
} else {
	logger.debug('Using normal configuration...')
}

const normalConfig = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	// This one is not used. Logger.ts uses directly the env variable
	LOGGER_LEVEL: process.env.LOGGER_LEVEL! ? process.env.LOGGER_LEVEL : 'info',
	IP: process.env.IP!,
	PORT: process.env.GTW_PORT!,
	NM: {
		HOST: process.env.NM_HOST!,
		TIMEOUT: process.env.NM_TIMEOUT || 10000 // 10 sec
	},
	DLT: {
		HOST: process.env.DLT_HOST || 'https://auroralvm.dlt.iti.gr',
		PORT: process.env.DLT_PORT || 443,
		MGMT_PORT: process.env.DLT_MGMT_PORT || 9090,
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

const testConfig = {
	HOME_PATH: process.cwd(),
	NODE_ENV: 'test',
	LOGGER_LEVEL: 'debug',
	IP: '0.0.0.0',
	PORT: '8181',
	NM: {
		HOST: 'https://auroral.dev.bavenir.eu',
		TIMEOUT: 10000 // 10 sec
	},
	DLT: {
		HOST: 'https://auroralvm.dlt.iti.gr',
		PORT: 3000,
		MGMT_PORT: 4002,
		ENABLED: false
	},
	TOKEN: {
		TTL: 86400, // 1 day
		REFRESH: 14400000 // 4h
	},
	GATEWAY: {
		ID: 'testtest',
		PASSWORD: 'testtest'
	},
	XMPP: {
		SERVICE: 'xmpp://auroral.dev.bavenir.eu:5222',
		DOMAIN: 'auroral.dev.bavenir.eu',
		RESOURCE: 'AuroralNode',
		ROSTER_REFRESH: 300000, // Defaults 5 min
		ENVIRONMENT: 'a',
		SIGN_MESSAGES: false
	},
	EVENTS: {
		SETTINGS_FILE: process.env.EVENT_SETTINGS_FILE || '/persistance/events.json',
	},
	AGENT: {
		IP: 'localhost', 
		PORT: 81,
		TIMEOUT: 10000 // 10 sec
	},
	DB: {
		HOST: 'localhost',
		PORT: 6379,
		PASSWORD: 'test',
		CACHE_TTL: 0 // Time to live of the values cached from the adapter
	}
}

export const Config = process.env.NODE_ENV === 'test' ? testConfig : normalConfig 
