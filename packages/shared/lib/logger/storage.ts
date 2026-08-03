import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import { LOGGER_DB_PREFIX } from './constants';
import type { LogEntry } from './types';

interface LoggerDB extends DBSchema {
    logs: {
        key: string;
        value: LogEntry;
        indexes: { 'by-timestamp': number };
    };
}

/**
 * v1 stored one ciphertext per log argument. v2 stores a single ciphertext per line,
 * so the old rows cannot be read back. Logs are 7-day diagnostic data, so the upgrade
 * drops them rather than migrating.
 */
const DB_VERSION = 2;

/**
 * IndexedDB-backed log storage.
 *
 * Every method rejects when IndexedDB is unavailable (private browsing, blocked
 * storage, some webviews). Callers are expected to treat that as "no persistence"
 * rather than an error worth surfacing.
 */
export class IndexedDBStorage {
    private dbPromise: Promise<IDBPDatabase<LoggerDB>> | null = null;

    private readonly dbName: string;

    constructor(loggerName: string, loggerID: string) {
        this.dbName = `${LOGGER_DB_PREFIX}${loggerName}${loggerID}`;
    }

    private getDB(): Promise<IDBPDatabase<LoggerDB>> {
        if (!this.dbPromise) {
            this.dbPromise = openDB<LoggerDB>(this.dbName, DB_VERSION, {
                upgrade(db) {
                    if (db.objectStoreNames.contains('logs')) {
                        db.deleteObjectStore('logs');
                    }
                    db.createObjectStore('logs', { keyPath: 'id' }).createIndex('by-timestamp', 'timestamp');
                },
            });
        }
        return this.dbPromise;
    }

    async store(entry: LogEntry): Promise<void> {
        const db = await this.getDB();
        await db.put('logs', entry);
    }

    /** Entries in ascending timestamp order. */
    async retrieve(): Promise<LogEntry[]> {
        const db = await this.getDB();
        return db.getAllFromIndex('logs', 'by-timestamp');
    }

    async count(): Promise<number> {
        const db = await this.getDB();
        return db.count('logs');
    }

    async clear(): Promise<void> {
        const db = await this.getDB();
        await db.clear('logs');
    }

    /** Removes the `count` oldest entries. */
    async removeOldest(count: number): Promise<void> {
        if (count <= 0) {
            return;
        }

        const db = await this.getDB();
        const tx = db.transaction('logs', 'readwrite');
        let removed = 0;

        for await (const cursor of tx.store.index('by-timestamp').iterate()) {
            if (removed >= count) {
                break;
            }
            await cursor.delete();
            removed++;
        }

        await tx.done;
    }

    /** Removes entries older than `timestamp`, returning how many were removed. */
    async removeOlderThan(timestamp: number): Promise<number> {
        const db = await this.getDB();
        const tx = db.transaction('logs', 'readwrite');
        let removed = 0;

        for await (const cursor of tx.store.index('by-timestamp').iterate(IDBKeyRange.upperBound(timestamp))) {
            await cursor.delete();
            removed++;
        }

        await tx.done;
        return removed;
    }

    async close(): Promise<void> {
        if (!this.dbPromise) {
            return;
        }
        const db = await this.dbPromise;
        db.close();
        this.dbPromise = null;
    }

    /** Closes the connection and removes the database entirely. */
    async deleteDatabase(): Promise<void> {
        await this.close();
        await deleteDB(this.dbName);
    }
}
