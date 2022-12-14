import { clients } from './xmpp'
import { JsonType } from '../types/misc-types'
import { agent } from '../connectors/agent-connector'

// Types
interface LocalResponse {
    success: boolean,
    body: JsonType 
}

// ONLY LOCAL

export async function getPropertyLocaly(sourceOid: string, pid: string, oid: string, reqParams: JsonType): Promise<LocalResponse> {
    if (!clients.has(oid)) {
        return { success: false, body: {} }
    } else {
        const response = await agent.getProperty(sourceOid, pid, oid, reqParams)
        return { success: true, body: response.message }
    }
}

export async function putPropertyLocaly(sourceOid: string, pid: string, oid: string, body: JsonType, reqParams: JsonType): Promise<LocalResponse> {
    if (!clients.has(oid)) {
        return { success: false, body: {} }
    } else {
        const response = await agent.putProperty(sourceOid, pid, oid, body, reqParams)
        return { success: true, body: response.message }
    }
}
