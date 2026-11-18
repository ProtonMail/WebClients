import { type IDBPDatabase, openDB } from 'idb';

import { type Database, getDBName } from './schema';

/**
 * Every connection closes itself when another one wants to delete or upgrade the database, e.g. another tab
 * dropping it after a `ContentSearchIndexation` switch, instead of blocking it for as long as it stays open.
 * Anything still using this connection afterwards fails, which only happens to a tab whose database is gone.
 * `onClosed` is called when that happens, or when the browser closes the connection itself, so a holder of
 * a long-lived connection can replace it.
 */
export async function openContentSearchDB(userId: string, onClosed?: () => void): Promise<IDBPDatabase<Database>> {
    const db = await openDB<Database>(getDBName(userId), 3, {
        blocking: () => {
            db.close();
            onClosed?.();
        },
        terminated: () => {
            onClosed?.();
        },
        upgrade: (db, oldVersion) => {
            if (oldVersion < 1) {
                db.createObjectStore('config');
                db.createObjectStore('index_blobs');
            }
            if (oldVersion < 2) {
                db.createObjectStore('outdated_import_ids');
            }
            if (oldVersion < 3) {
                db.createObjectStore('anchors');
                db.createObjectStore('event_cursor');
                db.createObjectStore('message_cache');
            }
        },
    });
    return db;
}
