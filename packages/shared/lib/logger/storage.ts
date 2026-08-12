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

const DB_VERSION = 1;

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
        // Separated, so that ('mail', 'abc') and ('mailabc', '') cannot name the same database.
        this.dbName = `${LOGGER_DB_PREFIX}${loggerName}-${loggerID}`;
    }

    private getDB(): Promise<IDBPDatabase<LoggerDB>> {
        if (!this.dbPromise) {
            this.dbPromise = openDB<LoggerDB>(this.dbName, DB_VERSION, {
                upgrade(db) {
                    db.createObjectStore('logs', { keyPath: 'id' }).createIndex('by-timestamp', 'timestamp');
                },
                // Another tab is upgrading or deleting this database and this connection is what
                // holds it up. Close so it can proceed; the next call reopens behind it.
                blocking: () => {
                    this.close().catch(() => {});
                },
                // The browser dropped the connection (storage cleared, quota reclaimed).
                terminated: () => {
                    this.dbPromise = null;
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
        const opening = this.dbPromise;
        if (!opening) {
            return;
        }

        this.dbPromise = null;
        // An open that failed has no connection to close, and must not fail the caller: closing
        // is also how `deleteDatabase` and the logger's `destroy` start.
        const db = await opening.catch(() => null);
        db?.close();
    }

    /** Closes the connection and removes the database entirely. */
    async deleteDatabase(): Promise<void> {
        await this.close();
        await deleteDB(this.dbName);
    }
}
