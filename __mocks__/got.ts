import { JsonType } from '../src/types/misc-types'

let fail = false
const got = jest.createMockFromModule('got') as any

// eslint-disable-next-line import/no-default-export
function extend() {
        return async (uri: string, body: { method: string }) => {
            if (!fail) {
                console.log(body.method + uri)
                return Promise.resolve({ body: responses[body.method + uri], statusCode: 200 })
            } else {
                throw new Error('MOCKED ERROR')
            }
        }
    }

function __toFail() {
    fail = true
}
function __notFail() {
    fail = false
}

const responses: JsonType = {
    'GETobjects/oid/properties/pid': 'test',
    'PUTobjects/oid/properties/pid': 'test',
    'PUTobjects/destinationOid/events/eid': 'test',
    'POSTobjects/destinationOid/discovery': 'test',
    'POSTobjects/destinationOid/notifications/nid': 'test',
    'GEThandshake': 'test',
    'GETcounters': 'test',
    'POSTcounters': 'test',
    'GETitems/sourceoid': 'test',
    'POSTitems/register': 'test',
    'POSTitems/remove': 'test',
    'PUTitems/modify': 'test',
    'DELETEagent/agid': 'test',
    'GETagent/agid/items': 'test',
    'GETagent/privacy': 'test',
    'GETagent/cid/reqid': 'test',
    'GETagent/contract/items/cid': 'test',
    'GETagent/partners': 'test',
    'GETagent/partner/partnerid': 'test',
    'GETdiscovery/nodes/organisation/cid': 'test',
    'GETdiscovery/nodes/organisation': 'test',
    'GETagent/communities': 'test',
    'GETagent/key/agid': 'test',
    'GETitems/agid/oid': 'test',
    'GETdiscovery/items/contract/cid': 'test',
    'GETdiscovery/items/organisation': 'test',
    'GETdiscovery/nodes/community/cid': 'test',
    'GETagent/key/undefined': 'test',

}

got.extend = extend
got.__toFail = __toFail
got.__notFail = __notFail

// eslint-disable-next-line import/no-default-export
export default got
