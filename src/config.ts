import dotenv from 'dotenv'
import { logger } from './utils/logger'

dotenv.config()

if (
	!process.env.NODE_ENV || !process.env.XMPP_IP
	|| !process.env.XMPP_PORT
) {
	logger.error('Please provide valid .env configuration')
	process.exit()
}

export const Config = {
	HOME_PATH: process.cwd(),
	NODE_ENV: process.env.NODE_ENV!,
	IP: process.env.XMPP_IP!,
	PORT: process.env.XMPP_PORT!,
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
		ROSTER_REFRESH: process.env.ROSTER_REFRESH || 600000 // Defaults 10 min
	}
}
