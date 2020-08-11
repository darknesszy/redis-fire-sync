import firebase from 'firebase/app'
import 'firebase/analytics'
import 'firebase/auth'
import 'firebase/firestore'
import dotenv from 'dotenv'
import redisClient from './utils/redis-client'

const result = dotenv.config()
if (result.error) throw result.error

console.log('# Redis FireSync Initialising...')

// Firebase app setup.
firebase.initializeApp(require(process.env['FIREBASE_CONFIG_JSON']!))

// Redis client setup.
redisClient.initialiseClient({ port: 6377 })