import { HttpStatusCode , logger , MyError } from '../utils'
import { clients } from './xmpp'
import { JsonType } from '../types/misc-types'
import { agent } from '../connectors/agent-connector'

// Types
interface localResponse {
    success: boolean,
    body: JsonType 
}

// ONLY LOCAL

export async function getPropertyLocaly(sourceOid: string, pid: string, oid: string): Promise<localResponse> {
    if (!clients.has(oid)) {
        console.log('Not found localy: ' + oid)
        return { success: false, body: {} }
    } else {
        const response = await agent.getProperty(sourceOid, pid, oid)
        return { success: true, body: response.message }
    }
}

export async function putPropertyLocaly(sourceOid: string, pid: string, oid: string, body: JsonType): Promise<localResponse> {
    const xmppClient = clients.get(sourceOid)
    if (!xmppClient) {
        return { success: false, body: {} }
    }
    const response = await agent.putProperty(sourceOid, pid, oid, body)
    if (response.error) {
        return { success: false, body: {} }
    }
    return { success: true, body: response }
}
