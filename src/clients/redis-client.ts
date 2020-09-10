import { injectable } from "inversify"
import { promisify } from 'util'
import redis, { RedisClient as Client } from 'redis'

@injectable()
export class RedisClient {
    private client: Client

    constructor() {
        this.client = redis.createClient()
        this.client.on('error', err => console.error(err))
    }

    connect() {
        return {
            clear: promisify(this.client.flushall).bind(this.client),
            increment: promisify(this.client.incr).bind(this.client),
            addHash: promisify(this.client.hmset).bind(this.client),
            addList: promisify(this.client.lpush).bind(this.client) as any,
        }
    }

    dispose() {
        this.client.quit()
    }
}