import errorHandler from 'errorhandler'
import stoppable from 'stoppable'
import { stopAllXMPPClients, initialize, startXMPPClient } from './core/xmpp'
import { app } from './app'
import { Config } from './config'
import { Token } from './core/nodeToken'
import { nmToken } from './core/platformToken'
import { nm } from './connectors/nm-connector'
import { logger, errorHandler as eH } from './utils'
import { events } from './core/events'
import { Registrations } from './core/registrations'
import { sendRecords } from './core/records'

/**
 * Error Handler. Provides full stack - only in dev
 */
if (Config.NODE_ENV === 'development') {
  app.use(errorHandler())
}

/**
 * Bootstrap app
 * Initialize gateway
 */
async function bootstrap () {
  try {
    logger.info('##############################################')
    logger.info('##############################################')
    logger.info('Starting AURORAL gateway!!')
    await Token.start()
    const platformToken = await nm.handshake()
    nmToken.setCredentials(JSON.parse(platformToken.message))
    initialize(Config.GATEWAY.ID, Config.GATEWAY.PASSWORD)
    await startXMPPClient(Config.GATEWAY.ID)
    events.loadEventChannelsFromFile()
    await Registrations.start()
    logger.info('##############################################')
    logger.info('##############################################')
  } catch (err: unknown) {
    const error = eH(err)
    logger.error(error.message)
    logger.error('Gateway was stopped due to errors...')
    logger.info('##############################################')
    logger.info('##############################################')
    process.exit(1)
  }
}

/*
  WEB SERVER lifecycle
  Start server
  Connection manager wrapping to end connections gracefully
  Control kill signals
  Control HTTP server errors
*/
function startServer() {
  return stoppable(app.listen(app.get('port'), app.get('ip'), () => {
    // Server started
    logger.info(
      `  App is running at ${app.get('ip')}:${app.get('port')} in ${app.get('env')} mode`)
    logger.info(`  App root path is ${Config.HOME_PATH}`)
    logger.info('  Press CTRL-C to stop\n')
    bootstrap()
  }), 3000)
}

// App
const server = startServer()

// gracefully shut down server
function shutdown() {
  events.storeEventChannelsToFile()
  stopAllXMPPClients(() => {
    server.stop((err) => {
      if (err) {
        logger.error(err)
        process.exitCode = 1
      }
      // Send remaining record counters to NM
      sendRecords()
      .catch((_err) => {
        logger.warn('Counters could not be stored...')
      })
      .finally(() => {
        logger.info('BYE!')
        process.exit()
      })
    }) // decorated by stoppable module to handle keep alives 
  })
}

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', () => {
  logger.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ')
  shutdown()
})

// quit properly on docker stop
process.on('SIGTERM', () => {
  logger.info('Got SIGTERM (docker container stop). Graceful shutdown ')
  shutdown()
})

// eslint-disable-next-line import/no-default-export
export default server
