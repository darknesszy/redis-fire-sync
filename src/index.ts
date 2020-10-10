import 'reflect-metadata'
import dotenv from 'dotenv'
import { Container } from 'inversify'
import { DatabaseETL } from './database'
import { FirestoreClient, RedisClient } from './clients'
import minimist from 'minimist'

const result = dotenv.config()
if (!result.error) console.log('Environment Variables from .env is used')
// Setup XML
global.XMLHttpRequest = require("xhr2")

const serviceProvider = new Container()
serviceProvider.bind<FirestoreClient>(FirestoreClient).toSelf().inSingletonScope()
serviceProvider.bind<RedisClient>(RedisClient).toSelf().inSingletonScope()
serviceProvider.bind<DatabaseETL>(DatabaseETL).toSelf().inTransientScope()

console.log('# Running Redis FireSync...')

var args = minimist(process.argv.slice(2))
if (args['database']) {
    const toSync: string | undefined = args['s'] || args['sync']
    if(toSync) {
        const collections = toSync.split(',').map(el => {
            const variables = el.split(':')
            return {
                name: variables ? variables[0] : el,
                indexKey: variables ? variables[1] : undefined
            }
        })

        const databaseETL = serviceProvider.resolve(DatabaseETL)
        collections.reduce(
            (acc, cur) => acc.then(() => databaseETL.syncToRedis(cur.name, cur.indexKey)),
            databaseETL.clearRedis()
        )
            .then(() => databaseETL.complete())
            .then(() => console.log('# Done...'))
    } else {
        console.log('No Collection Name provided')
    }
} else if (args['clear']) {
    const databaseETL = serviceProvider.resolve(DatabaseETL)
    databaseETL.clearRedis()
} else {
    throw Error('Not a valid command');
}