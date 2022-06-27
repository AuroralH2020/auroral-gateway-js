import { JsonType } from './misc-types'

export type RosterItem = {
    jid: string,
    name: string,
    subscription: string
}
  
export type XMPPMessage = {
    messageType: number,
    requestOperation: number, // Needed??
    isRequest: number, // 1 = isReq, 0 = isNotReq
    requestId: string, // ID of the message
    sourceAgid: string,
    sourceOid: string,
    destinationOid: string,
    requestBody: string | null,
    attributes: JsonType,
    parameters: JsonType
}