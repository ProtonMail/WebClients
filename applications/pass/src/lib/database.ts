import { type DBSchema, type IDBPDatabase, deleteDB, openDB } from 'idb';

import { type Maybe } from '@proton/pass/types/utils';
import { type EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

export interface PassDB extends DBSchema {
    cache: { key: 'state'; value: Blob } | { key: 'snapshot'; value: Blob } | { key: 'salt'; value: Blob };
}

export const CACHE_DB_VERSION = 1;

/** DB is created for each userID for future-proofing account switching
 * capabilities. */
export const getPassDBName = (userID: string) => `pass:db::${userID}`;
export const deletePassDB = async (userID: string) => deleteDB(getPassDBName(userID)).catch(noop);

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
export const writeDBCache = async (userID: string, cache: EncryptedPassCache): Promise<void> => {
    try {
        const db = await openPassDB(userID);
        if (!db) throw new Error('No database found');
        const tx = db.transaction('cache', 'readwrite');

        await Promise.all([
            tx.store.put(new Blob([cache.state ?? ''], { type: 'text/plain' }), 'state'),
            tx.store.put(new Blob([cache.snapshot ?? ''], { type: 'text/plain' }), 'snapshot'),
            tx.store.put(new Blob([cache.salt ?? ''], { type: 'text/plain' }), 'salt'),
            tx.done,
        ]);

        db.close();
    } catch (err) {
        logger.error('[PassDB] Could not write cache', err);
    }
};

/** Retrieves the cached state blobs from the cache object store.  */
export const getDBCache = async (userID: string): Promise<Partial<EncryptedPassCache>> => {
    try {
        const db = await openPassDB(userID);
        if (!db) throw new Error('No database found');
        const tx = db.transaction('cache', 'readwrite');

        const [state, snapshot, salt] = await Promise.all([
            tx.store.get('state').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.store.get('snapshot').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.store.get('salt').then((value) => (value instanceof Blob ? value?.text() : undefined)),
            tx.done.then(noop),
        ] as const);

        db.close();

        return { state, snapshot, salt };
    } catch (err) {
        logger.error('[PassDB] Could not resolve cache', err);
        return {};
    }
};
