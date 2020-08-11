import redis, { ClientOpts, RedisClient } from 'redis'
import { promisify } from 'util'

let clientOptions: ClientOpts | undefined
let client: RedisClient

const initialiseClient = (options?: ClientOpts | undefined) => clientOptions = options
const connect = () => {
    if(!client) {
        client = redis.createClient(clientOptions)
        client.on('error', err => console.error(err))
    }

    return client
}

export default {
    initialiseClient,
    connect
}