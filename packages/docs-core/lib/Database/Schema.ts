/**
 * Manually increment this version when the schema changes
 */
export const CURRENT_DB_VERSION = 1
export const DATABASE_NAME = 'proton-docs'

/** A persisted version of a document @Commit */
interface IndexedCommit {
  id: string
  data: Uint8Array<ArrayBuffer>
}

export interface DatabaseSchema {
  commits: IndexedCommit
}

/**
 * A definition of a store and its indexes.
 */
interface StoreDefinition<Model = unknown> {
  storeName: string
  keyPath: keyof Model & string
  indexes: {
    name: string
    keyPath: keyof Model & string
    options?: IDBIndexParameters
  }[]
}

function createStore<Model>(db: IDBDatabase, storeDefinition: StoreDefinition<Model>) {
  const { storeName, keyPath, indexes } = storeDefinition
  const store = db.createObjectStore(storeName, { keyPath })
  indexes.forEach(({ name, keyPath, options }) => {
    store.createIndex(name, keyPath, options)
  })
}

type Migration = (db: IDBDatabase, oldVersion: number, newVersion: number) => void

export const migrations: Migration[] = [
  (db, oldVersion, newVersion) => {
    const isFirstTimeSetup = oldVersion === 0
    if (isFirstTimeSetup) {
      createStore<IndexedCommit>(db, {
        storeName: 'commits',
        keyPath: 'id',
        indexes: [{ name: 'id', keyPath: 'id', options: { unique: true } }],
      })
    }
  },
]
