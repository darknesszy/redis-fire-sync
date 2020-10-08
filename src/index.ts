import 'reflect-metadata'
import dotenv from 'dotenv'
import { Container } from 'inversify'
import { DatabaseETL } from './database'
import { FirestoreClient, RedisClient } from './clients'

const result = dotenv.config()
if (!result.error) console.log('Environment Variables from .env is used')
// Setup XML
global.XMLHttpRequest = require("xhr2")

const serviceProvider = new Container()
serviceProvider.bind<FirestoreClient>(FirestoreClient).toSelf().inSingletonScope()
serviceProvider.bind<RedisClient>(RedisClient).toSelf().inSingletonScope()
serviceProvider.bind<DatabaseETL>(DatabaseETL).toSelf().inTransientScope()

console.log('# Running Redis FireSync...')

const databaseETL = serviceProvider.resolve(DatabaseETL)

databaseETL.clearRedis()
.then(() => databaseETL.syncToRedis('product', 'name'))
.then(() => databaseETL.syncToRedis('promotion'))
.then(() => databaseETL.syncToRedis('category', 'name'))
.then(() => databaseETL.syncToRedis('faq'))
.then(() => databaseETL.syncToRedis('decoration'))
.then(() => databaseETL.syncToRedis('article', 'title'))
.then(() => databaseETL.complete())
.then(() => console.log('# Done...'))