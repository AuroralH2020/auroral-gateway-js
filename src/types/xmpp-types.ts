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
    requestBody: string | null,
    responseBody: string | null,
    attributes: JsonType,
    parameters: JsonType
}

export interface Options {
    oid: string,
    body?: string,
    eid: string,
    pid: string
  }
  
//   export interface OptionsEvent extends Options {
//     eid: string
//   }
  
//   export interface OptionsProperty extends Options {
//     pid: string
//   }
  
//   export interface OptionsAction extends Options {
//     aid: string
//   }
