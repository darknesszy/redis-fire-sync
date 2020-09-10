import 'reflect-metadata'
import dotenv from 'dotenv'
import { Container } from 'inversify'
import { DatabaseSyncer } from './database'
import { FirestoreClient, RedisClient } from './clients'

const result = dotenv.config()
if (!result.error) console.log('Environment Variables from .env is used')
// Setup XML
global.XMLHttpRequest = require("xhr2")

const serviceProvider = new Container()
serviceProvider.bind<FirestoreClient>(FirestoreClient).toSelf().inSingletonScope()
serviceProvider.bind<RedisClient>(RedisClient).toSelf().inSingletonScope()
serviceProvider.bind<DatabaseSyncer>(DatabaseSyncer).toSelf().inTransientScope()

console.log('# Running Redis FireSync...')

const databaseSyncer = serviceProvider.resolve(DatabaseSyncer)
databaseSyncer.syncToRedis()