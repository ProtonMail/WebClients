export const CURRENT_SHEETS_DB_VERSION = 1
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
}

export interface SheetsDatabaseSchema {
  patches: SheetsPatches
}

export const sheetsDBMigrations: ((db: IDBDatabase, oldVersion: number, newVersion: number) => void)[] = [
  (db, oldVersion, newVersion) => {
    const isFirstTimeSetup = oldVersion === 0
    if (isFirstTimeSetup) {
      const store = db.createObjectStore('patches', { keyPath: 'id', autoIncrement: true })
      store.createIndex('nodeKey', 'nodeKey')
    }
  },
]
