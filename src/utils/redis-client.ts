import redis, { ClientOpts, RedisClient } from 'redis'
import { promisify } from 'util'

let clientOptions: ClientOpts | undefined
let client: RedisClient

const initialiseClient = (options?: ClientOpts | undefined) => clientOptions = options
const getClient = () => {
    if(!client) {
        client = redis.createClient(clientOptions)
        client.on('error', err => console.error(err))
    }

    return client
}

const connect = () => {
    const currentClient = getClient()
    return {
        clear: promisify(currentClient.flushall).bind(currentClient),
        increment: promisify(currentClient.incr).bind(currentClient),
        addHash: promisify(currentClient.hmset).bind(currentClient),
        addList: promisify(currentClient.lpush).bind(currentClient) as any,
    }
}

export default {
    initialiseClient,
    getClient,
    connect
}