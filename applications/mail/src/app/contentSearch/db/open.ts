import { type IDBPDatabase, openDB } from 'idb';

import { type Database, getDBName } from './schema';

export async function openContentSearchDB(userId: string): Promise<IDBPDatabase<Database>> {
    return openDB<Database>(getDBName(userId), 3, {
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
}
