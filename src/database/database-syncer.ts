import { injectable, inject } from 'inversify'
import { firestore } from 'firebase-admin'
import { FirestoreClient, RedisClient } from '../clients'

@injectable()
export class DatabaseSyncer {
    @inject(FirestoreClient) private firestoreClient!: FirestoreClient
    @inject(RedisClient) private redisClient!: RedisClient

    private overflow: number = 0

    async syncToRedis() {
        console.log('# Clearing REDIS database: ', await this.redisClient.connect().clear())
        
        const collectionRef = this.firestoreClient.connect().collection('product')
        await this.syncCollection('product', await collectionRef.get())

        this.firestoreClient.dispose()
        this.redisClient.dispose()
    }

    async syncCollection(collectionName: string, snapshots: firestore.QuerySnapshot<firestore.DocumentData>) {
        for await (let doc of snapshots.docs) {
            this.mapToHash(doc.data(), { key: collectionName, index: doc.id }, 'name')
        }
    }

    private mapToHash(hashField: firestore.DocumentData, parent: { key: string, index: string }, primaryKey?: string) {
        this.failSafe()

        const redisHash = new Array<string>()

        for(let key of Object.keys(hashField)) {
            const value = hashField[key]

            if(Array.isArray(value)) {
                this.arrayToList(
                    value,
                    {
                        key: `${parent.key}_${key}`,
                        index: parent.index
                    }
                )
            } else if(typeof value == 'object') {
                if(value['seconds'] != undefined) {
                    redisHash.push(key)
                    redisHash.push(this.epochToDate(value))
                } else if(value['_databaseId'] != undefined) {
                    this.referenceToObject(value)
                } else {
                    this.mapToHash(
                        value,
                        {
                            key: `${parent.key}_${key}`,
                            index: parent.index
                        }
                    )
                }
            } else {
                redisHash.push(key)
                redisHash.push(value)
            }
        }
    
        this.overflow--
    
        const uuid = `${parent.key}:${parent.index}`
        this.redisClient.connect().addHash([uuid, ...redisHash])

        if(primaryKey != undefined && typeof hashField[primaryKey] == 'string') {
            this.redisClient.connect().addHash(
                [`${parent.key}_indexes`, hashField[primaryKey], parent.index]
            )
        }

        return uuid
    }

    arrayToList(arrayFields: firestore.DocumentData[], parent: { key: string, index: string }) {
        this.failSafe()

        if(arrayFields.length == 0) {
            return
        }

        const list = new Array<string>()
        let count = 0
        for(let fieldValue of arrayFields) {
            if(Array.isArray(fieldValue)) {
                list.push(
                    this.arrayToList(
                        fieldValue,
                        {
                            key: parent.key,
                            index: `${parent.index}:${count.toString()}`
                        }
                    ) || '_EMPTY'
                )
            } else if(typeof fieldValue == 'object') {
                if(fieldValue['seconds'] != undefined) {
                    list.push(this.epochToDate(fieldValue as any))
                } else if(fieldValue['_databaseId'] != undefined) {
                    this.referenceToObject(fieldValue as any)
                } else {
                    list.push(
                        this.mapToHash(
                            fieldValue,
                            {
                                key: parent.key,
                                index: `${parent.index}:${count.toString()}`
                            }
                        ) || '_EMPTY'
                    )
                }
            } else {
                list.push(fieldValue)
            }

            count++
        }
    
        this.overflow--
    
        const uuid = `${parent.key}:${parent.index}`
        this.redisClient.connect().addList(uuid, list)
        return uuid
    }

    private epochToDate(document: { seconds: number }) {
        // Timestamp { seconds: 1595040240, nanoseconds: 0 }
        return new Date(document.seconds * 1000).toISOString()
    }
    
    private referenceToObject(document: { _databaseId: string }) {
        // Document Reference Type
        throw new Error()
    }

    private failSafe() {
        if(this.overflow++ > 100) {
            console.error('ERROR: Stack overflow ', this.overflow)
            process.abort()
        }
    }
}