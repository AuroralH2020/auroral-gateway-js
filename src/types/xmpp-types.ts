import { JsonType } from './misc-types'

export enum MessageType {
    REQUEST = 1,
    RESPONSE = 2,
    EVENT = 3
}

export enum RequestOperation {
    GETLISTOFPROPERTIES = 0,
    GETPROPERTYVALUE = 1,
    SETPROPERTYVALUE = 2,
    GETLISTOFACTIONS = 3,
    STARTACTION = 4,
    GETTASKSTATUS = 5,
    CANCELTASK = 6,
    GETLISTOFEVENTS = 7,
    GETEVENTCHANNELSTATUS = 8,
    SUBSCRIBETOEVENTCHANNEL = 9,
    UNSUBSCRIBEFROMEVENTCHANNEL = 10,
    GETTHINGDESCRIPTION = 11,
    SENDNOTIFICATION = 12
}

export enum RecordStatusCode {
  MESSAGE_NOT_SENT = 1,
  RESPONSE_NOT_RECEIVED = 2,
  MESSAGE_OK = 3
}

export enum RecordStatus {
  MESSAGE_NOT_SENT = 'Request message was not possible to send',
  RESPONSE_NOT_RECEIVED = 'No response message received',
  MESSAGE_OK = 'OK'
}

export type RosterItem = {
    jid: string,
    name: string,
    subscription: string
}
  
export type XMPPMessage = {
    messageType: MessageType,
    requestOperation: RequestOperation,
    requestId: number, // ID of the message
    sourceAgid: string,
    sourceOid: string,
    destinationOid: string,
    requestBody: JsonType | null,
    responseBody: JsonType | null,
    attributes: JsonType,
    parameters: JsonType
}

export type XMPPErrorMessage = {
    messageType: MessageType,
    requestOperation: RequestOperation,
    requestId: number, // ID of the message
    sourceAgid: string,
    sourceOid: string,
    destinationOid: string,
    errorMessage: string,
    statusCode: number
}

export interface RecordType {
  messageType: RequestOperation, // In NM messageType contains reqOperation!!
  requestId: number, // ID of the message
  sourceOid: string,
  destinationOid: string,
  timestamp: number,
  messageSize: number,
  messageStatus: RecordStatus,
  messageStatusCode: RecordStatusCode,
  reqInitiator: boolean
}

export interface Options {
    originOid: string,
    body: JsonType | null,
    [x: string]: any
  }
  
  export interface SubscribeChannelOpt extends Options {
    eid: string
  }
  
  export interface PropertiesOpt extends Options {
    pid: string
  }

  export interface NotificationOpt extends Options {
    nid: string
  }
  
//   export interface OptionsAction extends Options {
//     aid: string
//   }
