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

export interface SheetsPatches {
  nodeKey: string
  timestamp: number
  patches: Uint8Array<ArrayBuffer>
  updateHash?: string
  type: SheetsPatchesType
  browserId?: string
}

export interface SheetsAction {
  nodeKey: string
  timestamp: number
  type: SheetsActionType
  content: Uint8Array<ArrayBuffer>
  browserId: string
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
