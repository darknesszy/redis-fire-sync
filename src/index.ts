import FirebaseAdmin from 'firebase-admin'
import dotenv from 'dotenv'
import redisClient from './utils/redis-client'
import SyncToRedis from './sync-to-redis'

const result = dotenv.config()
if (result.error) throw result.error
// Setup XML
global.XMLHttpRequest = require("xhr2")

console.log('# Redis FireSync Initialising...')

// Setup Firebase admin tool.
FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(require(process.env['FIREBASE_PRIVATE_KEY']!)),
    databaseURL: process.env['FIREBASE_URL']
})


// Redis client setup.
redisClient.initialiseClient()

console.log('# Running sync to redis...')
SyncToRedis.go()