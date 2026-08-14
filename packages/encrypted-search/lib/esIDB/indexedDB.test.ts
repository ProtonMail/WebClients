import 'fake-indexeddb/auto';
import { openDB } from 'idb';

import { INDEXEDDB_VERSION } from '../constants';
import { deleteESDB, hasESDB, openESDB } from './indexedDB';

// Use a short timeout for the "blocked delete" tests instead of the real
// ES_DELETE_DB_BLOCKED_TIMEOUT, so a blocked delete test doesn't have to wait 5s.
jest.mock('../constants', () => ({
    ...jest.requireActual('../constants'),
    ES_DELETE_DB_BLOCKED_TIMEOUT: 50,
}));

const ALL_STORES = ['config', 'events', 'indexingProgress', 'metadata', 'content'];

let counter = 0;
const uniqueUserID = () => `test-user-${Date.now()}-${counter++}`;

const getDBName = (userID: string) => `ES:${userID}:DB`;

/**
 * Simulates a production corruption: a DB that already reports it's at
 * INDEXEDDB_VERSION, but is missing one of its expected object stores. Since
 * oldVersion === newVersion when this DB is opened afterwards, the real upgrade()
 * callback is guaranteed by the IndexedDB spec to never fire for it.
 */
const createCorruptedDB = async (userID: string, missingStore: string) => {
    const db = await openDB(getDBName(userID), INDEXEDDB_VERSION, {
        upgrade(database) {
            for (const store of ALL_STORES) {
                if (store === missingStore) {
                    continue;
                }
                if (store === 'metadata') {
                    database.createObjectStore('metadata').createIndex('temporal', 'timepoint', { unique: true });
                } else if (store === 'content') {
                    database.createObjectStore('content').createIndex('byVersion', 'version');
                } else {
                    database.createObjectStore(store);
                }
            }
        },
    });
    db.close();
};

describe('openESDB', () => {
    it('creates a brand new DB with the full schema', async () => {
        const userID = uniqueUserID();

        const esDB = await openESDB(userID);

        expect(esDB).toBeDefined();
        expect([...esDB!.objectStoreNames].sort()).toEqual([...ALL_STORES].sort());

        const tx = esDB!.transaction(['content', 'metadata'], 'readonly');
        expect(tx.objectStore('content').indexNames.contains('byVersion')).toBe(true);
        expect(tx.objectStore('metadata').indexNames.contains('temporal')).toBe(true);
        await tx.done;

        esDB!.close();
    });

    it('repairs a pre-existing DB stuck below the target version with a missing store', async () => {
        const userID = uniqueUserID();

        // A DB created before the content store existed, i.e. oldVersion < INDEXEDDB_VERSION,
        // so a real upgrade transaction WILL fire when we open it below.
        const staleDB = await openDB(getDBName(userID), 3, {
            upgrade(database) {
                database.createObjectStore('config');
                database.createObjectStore('events');
                database.createObjectStore('indexingProgress');
                database.createObjectStore('metadata').createIndex('temporal', 'timepoint', { unique: true });
                // content deliberately not created, mirroring the pre-v3 incomplete schema bug
            },
        });
        staleDB.close();

        const esDB = await openESDB(userID);

        expect(esDB).toBeDefined();
        expect(esDB!.objectStoreNames.contains('content')).toBe(true);

        const tx = esDB!.transaction('content', 'readonly');
        expect(tx.objectStore('content').indexNames.contains('byVersion')).toBe(true);
        await tx.done;

        esDB!.close();
    });

    it('does not throw, silently repopulate, or hang when the DB is already at the target version but missing a store', async () => {
        const userID = uniqueUserID();
        await createCorruptedDB(userID, 'content');

        const openPromise = openESDB(userID);
        const timeoutGuard = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 2000));

        const result = await Promise.race([openPromise, timeoutGuard]);

        expect(result).not.toBe('TIMEOUT');
        expect(result).toBeUndefined();

        // The corrupted DB is left alone rather than silently deleted/recreated: only the
        // app-level dbCorruptError -> esDelete flow should do that, since it also resets
        // esStatus and the in-memory cache, not just the DB itself.
        expect(await hasESDB(userID)).toBe(true);
    });
});

describe('deleteESDB', () => {
    it('deletes an existing DB', async () => {
        const userID = uniqueUserID();
        const esDB = await openESDB(userID);
        esDB!.close();

        await deleteESDB(userID);

        expect(await hasESDB(userID)).toBe(false);
    });

    it('gives up waiting instead of hanging when another connection keeps the DB open', async () => {
        const userID = uniqueUserID();
        const blockingConnection = await openESDB(userID);
        expect(blockingConnection).toBeDefined();

        const start = Date.now();
        await deleteESDB(userID);
        const elapsed = Date.now() - start;

        // Resolved via the (mocked, 50ms) blocked-delete timeout, not by waiting forever
        // for the still-open connection to close.
        expect(elapsed).toBeLessThan(2000);

        // The real deleteDatabase() request is still pending in the background at this point
        // (we only stopped awaiting it). Close the blocking connection and give it a moment to
        // settle so it doesn't leak into the next test/process.
        blockingConnection!.close();
        await new Promise((resolve) => setTimeout(resolve, 100));
    });
});
