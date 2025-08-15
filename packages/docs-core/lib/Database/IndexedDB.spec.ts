import 'fake-indexeddb/auto'
import { IndexedDatabase } from './IndexedDB'
import type { LoggerInterface } from '@proton/utils/logs'
import type { DatabaseSchema} from './Schema';
import { CURRENT_DB_VERSION, DATABASE_NAME, migrations } from './Schema'

describe('IndexedDatabase', () => {
  const TEST_DB_NAME = DATABASE_NAME
  let db: IndexedDatabase<DatabaseSchema>
  const mockLogger = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as unknown as LoggerInterface

  beforeEach(() => {
    indexedDB = new IDBFactory()
    db = new IndexedDatabase<DatabaseSchema>(TEST_DB_NAME, CURRENT_DB_VERSION, migrations, mockLogger)
    jest.clearAllMocks()
  })

  describe('openDatabase', () => {
    it('should successfully open a database', async () => {
      const result = await db.openDatabase()
      expect(result.isFailed()).toBe(false)
      expect(result.getValue()).toBeInstanceOf(IDBDatabase)
    })

    it('should return existing database instance if already open', async () => {
      const result1 = await db.openDatabase()
      const result2 = await db.openDatabase()

      expect(result1.isFailed()).toBe(false)
      expect(result2.isFailed()).toBe(false)
      expect(result1.getValue()).toBe(result2.getValue())
    })

    it('should call onNewDatabase callback when creating new database', async () => {
      const onNewDatabase = jest.fn()
      await db.openDatabase(onNewDatabase)
      expect(onNewDatabase).toHaveBeenCalled()
    })
  })

  describe('migrations', () => {
    it('should run migrations', async () => {
      const db = new IndexedDatabase<DatabaseSchema>(TEST_DB_NAME, CURRENT_DB_VERSION, migrations, mockLogger)
      await db.openDatabase()
    })

    it('should apply migrations upon first open', async () => {
      // Open the database for the first time
      const openResult = await db.openDatabase()
      expect(openResult.isFailed()).toBe(false)
      const database = openResult.getValue()

      const storeNames = Array.from(database.objectStoreNames)
      expect(storeNames).toContain('commits')

      // Open a transaction just to check that the index exists
      const tx = database.transaction('commits', 'readonly')
      const store = tx.objectStore('commits')

      // This should not throw if the index is present
      const index = store.index('id')
      expect(index).toBeTruthy()
    })

    it('should apply multiple inline migrations defined in the test', async () => {
      interface TestSchemaV1 {
        commits: { id: string; data: Uint8Array<ArrayBuffer> }
      }

      interface TestSchemaV2 extends TestSchemaV1 {
        documents: { uuid: string; documentId: string; content: string }
      }

      // Define inline migrations
      const migrations = [
        // Migration for version 1
        (db: IDBDatabase, oldVersion: number, newVersion: number) => {
          if (oldVersion < 1) {
            const commitsStore = db.createObjectStore('commits', { keyPath: 'id' })
            commitsStore.createIndex('id', 'id', { unique: true })
          }
        },
        // Migration for version 2
        (db: IDBDatabase, oldVersion: number, newVersion: number) => {
          if (oldVersion < 2) {
            const documentsStore = db.createObjectStore('documents', { keyPath: 'uuid' })
            documentsStore.createIndex('documentId', 'documentId', { unique: false })
          }
        },
      ]

      // Initially open with version 1 and first migration
      let dbV1 = new IndexedDatabase<TestSchemaV1>(TEST_DB_NAME, 1, [migrations[0]], mockLogger)
      let openResult = await dbV1.openDatabase()
      expect(openResult.isFailed()).toBe(false)
      let database = openResult.getValue()

      // Check that commits store exists and has index
      let storeNames = Array.from(database.objectStoreNames)
      expect(storeNames).toContain('commits')

      let tx = database.transaction('commits', 'readonly')
      let store = tx.objectStore('commits')
      let index = store.index('id')
      expect(index).toBeTruthy()

      tx.abort()

      // Now upgrade to version 2 with both migrations
      let dbV2 = new IndexedDatabase<TestSchemaV2>(TEST_DB_NAME, 2, migrations, mockLogger)
      openResult = await dbV2.openDatabase()
      expect(openResult.isFailed()).toBe(false)
      database = openResult.getValue()

      // Now we should have both commits and documents
      storeNames = Array.from(database.objectStoreNames)
      expect(storeNames).toContain('commits')
      expect(storeNames).toContain('documents')

      // Check the index in documents
      tx = database.transaction('documents', 'readonly')
      store = tx.objectStore('documents')
      index = store.index('documentId')
      expect(index).toBeTruthy()

      // Insert and retrieve some data to ensure the store works
      const saveResult = await dbV2.saveRecords('documents', [
        { uuid: 'doc1', documentId: 'docA', content: 'Hello World' },
      ])
      expect(saveResult.isFailed()).toBe(false)

      const getResult = await dbV2.getRecordsByIndex('documents', 'documentId', 'docA')
      expect(getResult.isFailed()).toBe(false)
      const docs = getResult.getValue()
      expect(docs.length).toBe(1)
      expect(docs[0].content).toBe('Hello World')
    })
  })

  describe('getRecordsByIndex', () => {
    beforeEach(async () => {
      db = new IndexedDatabase<DatabaseSchema>(TEST_DB_NAME, CURRENT_DB_VERSION, migrations, mockLogger)
      await db.openDatabase()
    })

    it('should retrieve records by index', async () => {
      const testCommit = {
        id: 'test-commit-1',
        data: new Uint8Array([1, 2, 3]),
      }
      await db.saveRecords('commits', [testCommit])

      const result = await db.getRecordsByIndex('commits', 'id', 'test-commit-1')
      expect(result.isFailed()).toBe(false)
      expect(result.getValue()).toHaveLength(1)
      expect(result.getValue()[0]).toEqual(testCommit)
    })
  })

  describe('saveRecords', () => {
    it('should successfully save records', async () => {
      const result = await db.saveRecords('commits', [{ id: 'test-commit-1', data: new Uint8Array([1, 2, 3]) }])
      expect(result.isFailed()).toBe(false)
    })

    it('should handle empty records array', async () => {
      const result = await db.saveRecords('commits', [])
      expect(result.isFailed()).toBe(false)
    })
  })

  describe('deleteRecords', () => {
    it('should successfully delete records', async () => {
      await db.saveRecords('commits', [{ id: 'test-commit-1', data: new Uint8Array([1, 2, 3]) }])

      const result = await db.deleteRecords('commits', ['test-commit-1'])
      expect(result.isFailed()).toBe(false)

      const records = await db.getRecordsByIndex('commits', 'id', 'test-commit-1')
      expect(records.getValue()).toHaveLength(0)
    })

    it('should handle empty keys array', async () => {
      const result = await db.deleteRecords('commits', [])
      expect(result.isFailed()).toBe(false)
    })
  })

  describe('clearAllPayloads', () => {
    it('should successfully clear database', async () => {
      await db.openDatabase()

      const result = await db.clearAllPayloads()
      expect(result.isFailed()).toBe(false)
      expect((db as any).db).toBeUndefined()
    })
  })

  describe('deinit', () => {
    it('should clear database reference', async () => {
      await db.openDatabase()
      db.deinit()
      expect((db as any).db).toBeUndefined()
    })
  })
})
