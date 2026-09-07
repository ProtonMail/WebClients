import { type IDBPDatabase, openDB } from 'idb';

import { type Database, getDBName } from './schema';

export function openContentSearchDB(userId: string): Promise<IDBPDatabase<Database>> {
    return openDB<Database>(getDBName(userId), 2, {
        upgrade: (db, oldVersion) => {
            if (oldVersion < 1) {
                db.createObjectStore('config');
                db.createObjectStore('index_blobs');
            }
            if (oldVersion < 2) {
                db.createObjectStore('outdated_import_ids');
            }
        },
    });
}
