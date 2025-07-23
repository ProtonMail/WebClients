import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import { LOGGER_DB_PREFIX } from '../constants';
import type { LogEntry, Storage } from './types';

interface LoggerDB extends DBSchema {
    logs: {
        key: string;
        value: LogEntry;
        indexes: { 'by-timestamp': number };
    };
}

export class IndexedDBStorage implements Storage {
    private dbPromise: Promise<IDBPDatabase<LoggerDB>> | null = null;

    private dbName: string;

    constructor(
        private loggerName: string,
        private loggerID: string
    ) {
        this.dbName = this.getDatabaseName();

        // Test IndexedDB basic availability - fail fast for common issues
        if (typeof indexedDB === 'undefined') {
            throw new Error('IndexedDB is not available');
        }

        // Test if we can create a request (fails in some restricted environments)
        try {
            indexedDB.open('__test__', 1);
        } catch (error) {
            throw new Error(`IndexedDB is not functional: ${error}`);
        }
    }

    private getDatabaseName(): string {
        return `${LOGGER_DB_PREFIX}${this.loggerName}${this.loggerID}`;
    }

    private async getDB(): Promise<IDBPDatabase<LoggerDB>> {
        if (!this.dbPromise) {
            this.dbPromise = openDB<LoggerDB>(this.dbName, 1, {
                upgrade(db) {
                    const store = db.createObjectStore('logs', { keyPath: 'id' });
                    store.createIndex('by-timestamp', 'timestamp');
                },
            });
        }
        return this.dbPromise;
    }

    async store(entry: LogEntry): Promise<void> {
        const db = await this.getDB();
        await db.put('logs', entry);
    }

    async retrieve(): Promise<LogEntry[]> {
        const db = await this.getDB();
        return db.getAllFromIndex('logs', 'by-timestamp');
    }

    async clear(): Promise<void> {
        // Delete the entire database instead of just clearing
        await this.deleteDatabase();
    }

    async deleteDatabase(): Promise<void> {
        // Close any existing connection
        if (this.dbPromise) {
            const db = await this.dbPromise;
            db.close();
            this.dbPromise = null;
        }
        // Delete the entire database
        await deleteDB(this.dbName);
    }

    async getCount(): Promise<number> {
        const db = await this.getDB();
        return db.count('logs');
    }

    async removeOldest(count: number): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction('logs', 'readwrite');
        const index = tx.store.index('by-timestamp');

        let deletedCount = 0;
        for await (const cursor of index.iterate()) {
            if (deletedCount >= count) {
                break;
            }
            await cursor.delete();
            deletedCount++;
        }
        await tx.done;
    }

    async removeOlderThan(timestamp: number): Promise<number> {
        const db = await this.getDB();
        const tx = db.transaction('logs', 'readwrite');
        const index = tx.store.index('by-timestamp');
        const range = IDBKeyRange.upperBound(timestamp);

        let deletedCount = 0;
        for await (const cursor of index.iterate(range)) {
            await cursor.delete();
            deletedCount++;
        }
        await tx.done;

        // Check if database is now empty
        const remainingCount = await this.getCount();
        if (remainingCount === 0) {
            // Database is empty, delete it entirely
            await this.deleteDatabase();
        }

        return deletedCount;
    }

    async close(): Promise<void> {
        if (this.dbPromise) {
            const db = await this.dbPromise;
            db.close();
            this.dbPromise = null;
        }
    }
}
