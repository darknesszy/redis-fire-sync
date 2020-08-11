import firebaseapp, { firestore, storage } from 'firebase/app'
import redisClient from '../utils/redis-client'

const go = async () => {
    console.log('# Attempt clearing redis database: ', await redisClient.connect().clear())
    // const manifest = await fetchBlobManifest('christmas')
    await fetchData('products', 'name')
}

const fetchData = async (collection: string, searchKey?: string, blobManifest?: string[]) => {
    console.log('# Fetching collection: ', collection)
    const client = firestore()
    const snapshot = await client.collection(collection).get()
    snapshot.forEach(doc => handleDocument(collection, doc.id, doc.data(), searchKey))
}

let overflow = 0
const handleDocument = (
    primaryKey: string, 
    uuid: string, 
    document: firestore.DocumentData, 
    searchKey?: string, 
    blobManifest?: string[]
) => {
    if(overflow++ > 100) {
        console.error('ERROR: Stack overflow ', overflow)
        process.abort()
    }

    const dict = new Array<string>()

    Object.keys(document).forEach(key => {
        if(Array.isArray(document[key])) {
            handleArray(primaryKey, uuid, key, document[key])
        } else if(typeof document[key] == 'object') {
            if(document[key]['seconds'] != undefined) {
                dict.push(key)
                dict.push(handleTime(key, document))
            } else {
                handleDocument(`${primaryKey}_${key}`, uuid, document[key])
            }
        } else {
            dict.push(key)
            dict.push(document[key])
        }
    })

    redisClient.connect().addHash([`${primaryKey}:${uuid}`, ...dict])
    searchKey && redisClient.connect().addHash([primaryKey, document[searchKey], uuid])

    overflow--
}

const handleArray = (primaryKey: string, uuid: string, key: string, list: Array<{ [field: string]: any }>) => {
    redisClient.connect().addList(`${primaryKey}_${key}:${uuid}`, list)
}

const handleTime = (key: string, document: { [field: string]: { seconds: number } }) => {
    // Timestamp { seconds: 1595040240, nanoseconds: 0 }
    return new Date(document[key].seconds * 1000).toISOString()
}

const fetchBlobManifest = async (path?: string) => {
    const blobClient = firebaseapp.storage().ref(path)
    const list = new Array<string>()

    try {
        const manifest = await blobClient.listAll()
        manifest.items.forEach(ref => list.push(ref.fullPath))

        return list
    } catch (err) {
        console.error('err', err)
    } finally {
        return list
    }
}

export default {
    go,
    fetchData
}