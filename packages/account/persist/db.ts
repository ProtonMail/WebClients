import { type DBSchema, type IDBPDatabase, openDB } from 'idb';

import noop from '@proton/utils/noop';

const storeName = 'entry' as const;
const dbName = 'store' as const;
const dbVersion = 5;

interface StoredEncryptedCache {
    state: Uint8Array<ArrayBuffer>;
    date: Date;
    appVersion: string;
    version: number;
}

export interface StoreDB extends DBSchema {
    [storeName]: { key: string; value: StoredEncryptedCache };
}

export type EncryptedCache = {
    state: Uint8Array<ArrayBuffer>;
    appVersion: string;
};

export type DecryptedCache<T> = {
    state: T;
    appVersion: string;
};

export const CACHE_DB_VERSION = 1;

export const openStoreDB = async (): Promise<IDBPDatabase<StoreDB>> => {
    const db = await openDB<StoreDB>(dbName, CACHE_DB_VERSION, {
        upgrade: (db) => {
            db.createObjectStore(storeName, { keyPath: null });
        },
    });

    if (!db) {
        throw new Error('No database found');
    }

    return db;
};

export const writeStore = async (userID: string, cache: EncryptedCache): Promise<void> => {
    const db = await openStoreDB();
    const tx = db.transaction(storeName, 'readwrite');

    await Promise.all([
        tx.store.put(
            {
                state: cache.state,
                appVersion: cache.appVersion,
                date: new Date(),
                version: dbVersion,
            },
            userID
        ),
        tx.done,
    ]);

    db.close();
};

export const deleteStore = async (userID: string): Promise<void> => {
    const db = await openStoreDB();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all([tx.store.delete(userID), tx.done]);
    db.close();
};

export const readStore = async (userID: string): Promise<EncryptedCache | undefined> => {
    const db = await openStoreDB();
    const tx = db.transaction(storeName, 'readwrite');

    const [cache] = await Promise.all([
        tx.store.get(userID).then(async (value) => {
            if (!value) {
                return undefined;
            }
            const { state, appVersion, version = 0 } = value;
            if (!state || version !== dbVersion) {
                return undefined;
            }
            return {
                state,
                appVersion,
                version,
            };
        }),
        tx.done.then(noop),
    ] as const);

    db.close();

    return cache;
};

export const pruneStores = async (userIDs: string[]) => {
    const db = await openStoreDB();
    const tx = db.transaction(storeName, 'readwrite');
    const userIDsSet = new Set(userIDs);
    const keys = await tx.store.getAllKeys();
    const keysToDelete = keys.filter((key) => !userIDsSet.has(key));
    if (keysToDelete.length) {
        await Promise.all(keysToDelete.map((key) => tx.store.delete(key)));
    }
    await tx.done;
    db.close();
};
