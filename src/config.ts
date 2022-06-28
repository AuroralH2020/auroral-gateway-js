import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

if (
	!process.env.NODE_ENV || !process.env.IP
	|| !process.env.PORT
) {
	logger.error('Please provide valid .env configuration')
	process.exit()
}

export const Config = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	IP: process.env.IP!,
	PORT: process.env.PORT!,
	NM: {
		HOST: process.env.NM_HOST!,
		TIMEOUT: process.env.NM_TIMEOUT || 10000 // 10 sec
	},
	TOKEN: {
		TTL: process.env.TOKEN_TTL || 86400, // 1 day
		REFRESH: process.env.TOKEN_REFRESH || 14400000 // 4h
	},
	GATEWAY: {
		ID: process.env.GATEWAY_ID!,
		PASSWORD: process.env.GATEWAY_PASSWORD!
	},
	XMPP: {
		SERVICE: process.env.XMPP_SERVICE!,
		DOMAIN: process.env.XMPP_DOMAIN!,
		RESOURCE: process.env.XMPP_RESOURCE!,
		ROSTER_REFRESH: process.env.ROSTER_REFRESH || 300000 // Defaults 5 min
	},
	EVENTS: {
		SETTINGS_FILE: process.env.EVENT_SETTINGS_FILE || 'events.json',
	},
	AGENT: {
		IP: process.env.AGENT_IP!, 
		PORT: process.env.AGENT_PORT!,
		TIMEOUT: process.env.AGENT_TIMEOUT || 10000 // 10 sec
	}
}
