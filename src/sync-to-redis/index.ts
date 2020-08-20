import { firestore, storage } from 'firebase-admin'
import redisClient from '../utils/redis-client'

let uniqueNum = 0

const go = async () => {
    console.log('# Attempt clearing redis database: ', await redisClient.connect().clear())
    // const manifest = await fetchBlobManifest('christmas')
    await fetchData('product', 'name')
}

const fetchData = async (collection: string, searchKey?: string, blobManifest?: string[]) => {
    console.log('# Fetching collection: ', collection)
    const client = firestore()
    const snapshot = await client.collection(`${collection}s`).get()
    snapshot.forEach(doc => handleMap(doc.data(), { key: collection, id: doc.id }, searchKey))
}

let overflow = 0
const handleMap = (
    data: firestore.DocumentData,
    root: {
        key: string,
        id: string
    }, 
    searchKey?: string
) => {
    if(overflow++ > 100) {
        console.error('ERROR: Stack overflow ', overflow)
        process.abort()
    }

    const dict = new Array<string>()

    Object.keys(data).forEach(key => {
        if(Array.isArray(data[key])) {
            handleArray(
                data[key],
                {
                    key: `${root.key}_${key}`,
                    id: root.id
                }
            )
        } else if(typeof data[key] == 'object') {
            if(data[key]['seconds'] != undefined) {
                dict.push(key)
                dict.push(handleTime(data[key]))
            } else if(data[key]['_databaseId'] != undefined) {
                handleReference(data[key])
            } else {
                handleMap(
                    data[key],
                    {
                        key: `${root.key}_${key}`,
                        id: root.id
                    }
                )
            }
        } else {
            dict.push(key)
            dict.push(data[key])
        }
    })

    overflow--

    const id = `${root.key}:${root.id}`
    redisClient.connect().addHash([id, ...dict])
    searchKey && typeof data[searchKey] == 'string' && redisClient.connect().addHash(
        [`${root.key}_indexes`, data[searchKey], root.id]
    )
    return id
}

const handleArray = (
    data: firestore.DocumentData[],
    root: {
        key: string,
        id: string
    }
) => {
    if(overflow++ > 100) {
        console.error('ERROR: Stack overflow ', overflow)
        process.abort()
    }

    if(data.length == 0) return

    const list = new Array<string>()

    data.forEach((el, i) => {
        if(Array.isArray(el)) {
            list.push(
                handleArray(
                    el,
                    {
                        key: root.key,
                        id: `${root.id}:${i.toString()}`
                    }
                ) || '_EMPTY'
            )
        } else if(typeof el == 'object') {
            if(el['seconds'] != undefined) {
                list.push(handleTime(el as any))
            } else if(el['_databaseId'] != undefined) {
                handleReference(el as any)
            } else {
                list.push(
                    handleMap(
                        el,
                        {
                            key: root.key,
                            id: `${root.id}:${i.toString()}`
                        }
                    ) || '_EMPTY'
                )
            }
        } else {
            list.push(el)
        }
    })

    overflow--

    const id = `${root.key}:${root.id}`
    redisClient.connect().addList(id, list)
    return id
}

const handleTime = (document: { seconds: number }) => {
    // Timestamp { seconds: 1595040240, nanoseconds: 0 }
    return new Date(document.seconds * 1000).toISOString()
}

const handleReference = (document: { _databaseId: string }) => {
    // Document Reference Type
    throw new Error()
}

// const fetchBlobManifest = async (path?: string) => {
//     const blobClient = storage().ref(path)
//     const list = new Array<string>()

//     try {
//         const manifest = await blobClient.listAll()
//         manifest.items.forEach(ref => list.push(ref.fullPath))

//         return list
//     } catch (err) {
//         console.error('err', err)
//     } finally {
//         return list
//     }
// }

export interface Field {
    key: string
    id: string
    data: firestore.DocumentData | firestore.DocumentData[]
    parent?: Field
}

export default {
    go,
    fetchData
}