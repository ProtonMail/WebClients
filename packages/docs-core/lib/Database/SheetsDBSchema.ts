import type { SheetsActionType } from '@proton/docs-shared/lib/SheetsActionType'

const SheetsDBVersions = {
  InitialVersion: 1,
  AddedActionsStore: 2,
} as const

export const CURRENT_SHEETS_DB_VERSION = SheetsDBVersions.AddedActionsStore
export const SHEETS_DATABASE_NAME = 'proton-sheets'

export enum SheetsPatchesType {
  Base = 0,
  Delta = 1,
  Drifted = 2,
}

/**
 * Which key/method encrypted a record's payload, so a reader can pick the matching
 * decryption path. Records written before this field existed have it `undefined` and
 * are treated as {@link SheetsRecordEncryption.ClientKey} (the original scheme).
 */
export enum SheetsRecordEncryption {
  /** Legacy: encrypted with the rotating session client key via `encryptDataForLocalStorage`. */
  ClientKey = 'clientKey',
  /** Encrypted with the document's own content key via `encryptAnonymousData`. */
  DocumentKey = 'documentKey',
}

export interface SheetsPatches {
  /**
   * Auto-incrementing primary key assigned by IndexedDB (see `sheetsDBMigrations`).
   * Absent when constructing a record to save; present when reading records back.
   */
  id?: number
  nodeKey: string
  timestamp: number
  patches: Uint8Array<ArrayBuffer>
  updateHash?: string
  type: SheetsPatchesType
  browserId?: string
  /**
   * Which key/method encrypted `patches`. Absent on legacy records (client key).
   */
  encryption?: SheetsRecordEncryption
  /**
   * Fingerprint of the document content key that encrypted this record, set only for
   * {@link SheetsRecordEncryption.DocumentKey} records. Lets a reader detect a record
   * encrypted under a different document key and skip it without a doomed decryption.
   * It is a SHA-256 digest, so it does not leak the key.
   */
  keyId?: string
}

export interface SheetsAction {
  /**
   * Auto-incrementing primary key assigned by IndexedDB (see `sheetsDBMigrations`).
   * Absent when constructing a record to save; present when reading records back.
   */
  id?: number
  nodeKey: string
  timestamp: number
  type: SheetsActionType
  content: Uint8Array<ArrayBuffer>
  browserId: string
  /**
   * Which key/method encrypted `content`. Absent on legacy records (client key).
   */
  encryption?: SheetsRecordEncryption
  /**
   * Fingerprint of the document content key that encrypted this record. See `SheetsPatches.keyId`.
   */
  keyId?: string
}

export interface SheetsDatabaseSchema {
  patches: SheetsPatches
  actions: SheetsAction
}

export const sheetsDBMigrations: ((db: IDBDatabase, oldVersion: number, newVersion: number) => void)[] = [
  (db, oldVersion, newVersion) => {
    const isFirstTimeSetup = oldVersion === 0
    if (isFirstTimeSetup) {
      const store = db.createObjectStore('patches', { keyPath: 'id', autoIncrement: true })
      store.createIndex('nodeKey', 'nodeKey')
    }
    if (oldVersion < SheetsDBVersions.AddedActionsStore) {
      const store = db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
      store.createIndex('nodeKey', 'nodeKey')
    }
  },
]
