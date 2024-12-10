import type { LoggerInterface } from '@proton/utils/logs'
import { Result } from '@proton/docs-shared'

export enum IndexedDBError {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  DB_BLOCKED = 'DB_BLOCKED',
  DB_DELETED = 'DB_DELETED',
  DB_VERSION_CHANGE = 'DB_VERSION_CHANGE',
  OPEN_FAILED = 'OPEN_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
}

export class IndexedDatabase<Schema extends Record<string, any>> {
  private db?: IDBDatabase

  constructor(
    public databaseName: string,
    private version: number,
    private migrations: ((db: IDBDatabase, oldVersion: number, newVersion: number) => void)[],
    private logger: LoggerInterface,
  ) {}

  public deinit(): void {
    this.db = undefined
  }

  public async openDatabase(onNewDatabase?: () => void): Promise<Result<IDBDatabase>> {
    if (this.db) {
      return Result.ok(this.db)
    }

    const request = window.indexedDB.open(this.databaseName, this.version)

    return new Promise((resolve) => {
      request.onerror = () => {
        this.logger.error('[IndexedDB] Failed to open database', { error: IndexedDBError.OPEN_FAILED })
        resolve(Result.fail(IndexedDBError.OPEN_FAILED))
      }

      request.onblocked = () => {
        this.logger.error('[IndexedDB] Database blocked', { error: IndexedDBError.DB_BLOCKED })
        resolve(Result.fail(IndexedDBError.DB_BLOCKED))
      }

      request.onsuccess = (event) => {
        const target = event.target as IDBOpenDBRequest
        const db = target.result

        db.onversionchange = () => {
          this.logger.info('[IndexedDB] Database version changed', { error: IndexedDBError.DB_VERSION_CHANGE })
          db.close()
          this.db = undefined
        }

        this.db = db
        resolve(Result.ok(db))
      }

      request.onupgradeneeded = (event) => {
        const target = event.target as IDBOpenDBRequest
        const db = target.result
        db.onversionchange = () => {
          db.close()
        }

        const oldVersion = event.oldVersion
        const newVersion = event.newVersion || this.version

        for (const migration of this.migrations) {
          migration(db, oldVersion, newVersion)
        }

        if (onNewDatabase) {
          const transaction = (event.currentTarget as IDBOpenDBRequest).transaction
          if (transaction) {
            transaction.oncomplete = () => {
              onNewDatabase()
            }
          }
        }
      }
    })
  }

  public async getRecordsByIndex<StoreName extends keyof Schema>(
    storeName: StoreName,
    indexName: string,
    value: IDBValidKey | IDBKeyRange,
  ): Promise<Result<Schema[StoreName][]>> {
    const dbResult = await this.openDatabase()
    if (dbResult.isFailed()) {
      this.logger.error('[IndexedDB] Failed to open database for getRecordsByIndex', { error: dbResult.getError() })
      return Result.fail(dbResult.getError())
    }
    const db = dbResult.getValue()

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName as string)
      const objectStore = transaction.objectStore(storeName as string)
      const index = objectStore.index(indexName)

      const request = index.getAll(value)

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest<Schema[StoreName][]>).result
        resolve(Result.ok(result || []))
      }

      request.onerror = () => {
        this.logger.error('[IndexedDB] Transaction failed in getRecordsByIndex', {
          error: IndexedDBError.TRANSACTION_FAILED,
        })
        resolve(Result.fail(IndexedDBError.TRANSACTION_FAILED))
      }
    })
  }

  public async saveRecords<StoreName extends keyof Schema>(
    storeName: StoreName,
    records: Schema[StoreName][],
  ): Promise<Result<void>> {
    if (records.length === 0) {return Result.ok()}

    const dbResult = await this.openDatabase()
    if (dbResult.isFailed()) {
      this.logger.error('[IndexedDB] Failed to open database for saveRecords', { error: dbResult.getError() })
      return Result.fail(dbResult.getError())
    }
    const db = dbResult.getValue()

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName as string, 'readwrite')

      transaction.onerror = (event) => {
        const error = (event.target as IDBRequest).error
        if (error?.name === 'QuotaExceededError') {
          this.logger.error('[IndexedDB] Quota exceeded in saveRecords', { error: IndexedDBError.QUOTA_EXCEEDED })
          resolve(Result.fail(IndexedDBError.QUOTA_EXCEEDED))
        } else {
          this.logger.error('[IndexedDB] Transaction failed in saveRecords', {
            error: IndexedDBError.TRANSACTION_FAILED,
          })
          resolve(Result.fail(IndexedDBError.TRANSACTION_FAILED))
        }
      }

      transaction.oncomplete = () => resolve(Result.ok())

      const objectStore = transaction.objectStore(storeName as string)
      records.forEach((item) => objectStore.put(item))
    })
  }

  public async deleteRecords<StoreName extends keyof Schema>(
    storeName: StoreName,
    keys: IDBValidKey[],
  ): Promise<Result<void>> {
    if (keys.length === 0) {return Result.ok()}

    const dbResult = await this.openDatabase()
    if (dbResult.isFailed()) {
      this.logger.error('[IndexedDB] Failed to open database for deleteRecords', { error: dbResult.getError() })
      return Result.fail(dbResult.getError())
    }
    const db = dbResult.getValue()

    return new Promise((resolve) => {
      let completed = 0
      const total = keys.length

      keys.forEach((key) => {
        const request = db
          .transaction(storeName as string, 'readwrite')
          .objectStore(storeName as string)
          .delete(key)
        request.onsuccess = () => {
          completed++
          if (completed === total) {resolve(Result.ok())}
        }
        request.onerror = () => {
          this.logger.error('[IndexedDB] Transaction failed in deleteRecords', {
            error: IndexedDBError.TRANSACTION_FAILED,
          })
          resolve(Result.fail(IndexedDBError.TRANSACTION_FAILED))
        }
      })
    })
  }

  public async clearAllPayloads(): Promise<Result<void>> {
    const deleteRequest = window.indexedDB.deleteDatabase(this.databaseName)

    return new Promise((resolve) => {
      deleteRequest.onerror = () => {
        this.logger.error('[IndexedDB] Transaction failed in clearAllPayloads', {
          error: IndexedDBError.TRANSACTION_FAILED,
        })
        resolve(Result.fail(IndexedDBError.TRANSACTION_FAILED))
      }
      deleteRequest.onsuccess = () => {
        this.db = undefined
        resolve(Result.ok())
      }
      deleteRequest.onblocked = () => {
        this.logger.error('[IndexedDB] Database blocked in clearAllPayloads', { error: IndexedDBError.DB_BLOCKED })
        resolve(Result.fail(IndexedDBError.DB_BLOCKED))
      }
    })
  }
}
