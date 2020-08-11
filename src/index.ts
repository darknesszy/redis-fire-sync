import firebase from 'firebase/app'
import 'firebase/analytics'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
import dotenv from 'dotenv'
import redisClient from './utils/redis-client'
import SyncToRedis from './sync-to-redis'

const result = dotenv.config()
if (result.error) throw result.error
// Setup XML
global.XMLHttpRequest = require("xhr2")

console.log('# Redis FireSync Initialising...')

// Firebase app setup.
firebase.initializeApp(require(process.env['FIREBASE_CONFIG_JSON']!))

// Redis client setup.
redisClient.initialiseClient({ port: 6377 })

console.log('# Running sync to redis...')

const main = async () => {
    await SyncToRedis.go()
}
main()