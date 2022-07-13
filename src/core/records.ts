import { HttpStatusCode, logger, errorHandler, MyError } from '../utils'
import { RecordType, RecordStatus, RecordStatusCode, RequestOperation } from '../types/xmpp-types'
import { nm } from '../connectors/nm-connector'
import { Config } from '../config'

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
        await sendRecords()
    }
}

export const sendRecords = async (): Promise<void> => {
    try {
        // Verify that there is something to send before sending to NM
        if (records.length > 0) {
            const recordsToSend = records
            // Remove records to be sent (Splice to avoid removing recent records)
            records.splice(0, recordsToSend.length)
            // Send records
            console.log(recordsToSend)
            await nm.postCounters(recordsToSend)
        } 
    } catch (err: unknown) {
        const error = errorHandler(err)
        logger.error(error.message)
        throw new MyError('Error storing counters...:' + error.message)
    }
}

