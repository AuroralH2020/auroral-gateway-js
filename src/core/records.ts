import { logger, errorHandler } from '../utils'
import { RecordType, RecordStatus, RecordStatusCode, RequestOperation } from '../types/xmpp-types'
import { nm } from '../connectors/nm-connector'

// Variables
const records: RecordType[] = []
const recordStatuses: RecordStatus[] = [RecordStatus.MESSAGE_NOT_SENT, RecordStatus.RESPONSE_NOT_RECEIVED, RecordStatus.MESSAGE_OK]
let counter: number = 0
const countersTimer: NodeJS.Timer = setInterval(() => {
    if (records.length > 0) {
        counter = 0
        sendRecords()
    }
  }, 600000) // Send every 10 min

// Functions
export const addRecord = async (messageType: RequestOperation, 
    requestId: number, 
    sourceOid: string, 
    destinationOid: string, 
    body: string, 
    messageStatusCode: RecordStatusCode, 
    reqInitiator: boolean): Promise<void> => {
    records.push(
        {
            messageType,
            requestId,
            sourceOid,
            destinationOid,
            timestamp: new Date().getTime(),
            messageSize: Buffer.byteLength(body, 'utf8'),
            messageStatus: recordStatuses[messageStatusCode - 1],
            messageStatusCode,
            reqInitiator
        }
    )
    // Increase counter and try to send records
    counter++
    // IF counter over 25 send records
    if (counter > 25) {
        counter = 0
        // run and forget
        sendRecords()
    }
}

export const sendRecords = async (): Promise<void> => {
    try {
        // Verify that there is something to send before sending to NM
        if (records.length > 0 && records.length <= 100) {
            logger.debug('Sending records [' + String(records.length) + '] [size: ' + Buffer.byteLength(records.toString(), 'utf8') + ']')
            // Implement queue here ?
            const recordsToSend = [...records]
            // Send records
            await nm.postCounters(recordsToSend)
            // Remove records to be sent (Splice to avoid removing recent records)
            records.splice(0, recordsToSend.length)
            counter = 0
        } 
        if (records.length > 100) {
            const recordsToSend = records.slice(0, 100)
            logger.debug('Sending records [100] [size: ' + Buffer.byteLength(recordsToSend.toString(), 'utf8') + ']')
            // Implement queue here ?
            // Send records
            await nm.postCounters(recordsToSend)
            // Remove records to be sent (Splice to avoid removing recent records)
            records.splice(0, recordsToSend.length)
            counter = 0
        } 
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error('Error storing counters' + error.message)
    }
}

