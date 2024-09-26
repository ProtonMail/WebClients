import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type Maybe } from '@proton/pass/types/utils';
import { type EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

export interface PassDB extends DBSchema {
    cache:
        | { key: 'encryptedCacheKey'; value: Blob }
        | { key: 'salt'; value: Blob }
        | { key: 'snapshot'; value: Blob }
        | { key: 'state'; value: Blob }
        | { key: 'version'; value: string };
}

export const CACHE_DB_VERSION = 1;
export const CACHE_DB_PREFIX = 'pass:db::';

export const getPassDBs = async () => (await indexedDB.databases()).map(prop('name')).filter(truthy);

/** DB is created for each userID for account switching capabilities. */
export const getPassDBName = (userID: string) => `${CACHE_DB_PREFIX}${userID}`;
export const getPassDBUserID = (dbName: string) => dbName.replace(CACHE_DB_PREFIX, '');

export const deletePassDB = async (userID: Maybe<string>) => {
    if (userID) await deleteDB(getPassDBName(userID)).catch(noop);
};

/** Opens the database for a specific UserID. Will create the database
 * when called for the first time. If opening the database fails for any
 * reason, returns `undefined` (ie: IDB not supported). */
export const openPassDB = async (userID: string): Promise<Maybe<IDBPDatabase<PassDB>>> =>
    openDB<PassDB>(getPassDBName(userID), CACHE_DB_VERSION, {
        upgrade: (db) => {
            db.createObjectStore('cache', { keyPath: null });
        },
    }).catch(noop);

/** Writes the encrypted pass state to the cache object store.
 * Converts the encrypted strings to blobs. Concurrent writes
 * can happen if multiple tabs are trying to cache the current
 * app state. */
export const writeDBCache = async (userID: string, cache: EncryptedPassCache, version: string): Promise<void> => {
    try {
        const db = await openPassDB(userID);
        if (!db) throw new Error('No database found');
        const tx = db.transaction('cache', 'readwrite');

        await Promise.all([
            tx.store.put(new Blob([cache.encryptedCacheKey ?? ''], { type: 'text/plain' }), 'encryptedCacheKey'),
            tx.store.put(new Blob([cache.salt ?? ''], { type: 'text/plain' }), 'salt'),
            tx.store.put(new Blob([cache.snapshot ?? ''], { type: 'text/plain' }), 'snapshot'),
            tx.store.put(new Blob([cache.state ?? ''], { type: 'text/plain' }), 'state'),
            tx.store.put(version, 'version'),
            tx.done,
        ]);

        db.close();
    } catch (err) {
        logger.warn('[PassDB] Could not write cache', err);
    }
};

/** Retrieves the cached state blobs from the cache object store.  */
export const getDBCache = async (userID: Maybe<string>): Promise<Partial<EncryptedPassCache>> => {
    try {
        const db = userID ? await openPassDB(userID) : null;
        if (!db) throw new Error('No database found');
        const tx = db.transaction('cache', 'readwrite');

        const [encryptedCacheKey, salt, snapshot, state, version] = await Promise.all([
            tx.store.get('encryptedCacheKey').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.store.get('salt').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.store.get('snapshot').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.store.get('state').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.store.get('version').then((value) => (typeof value === 'string' ? value : undefined)),
            tx.done.then(noop),
        ] as const);

        db.close();

        return { encryptedCacheKey, salt, snapshot, state, version };
    } catch (err) {
        logger.warn('[PassDB] Could not resolve cache', err);
        return {};
    }
};

export const getEncryptedCacheKey = async (userID: Maybe<string>): Promise<Maybe<string>> => {
    try {
        const cache = await getDBCache(userID);
        return cache.encryptedCacheKey;
    } catch {}
};
