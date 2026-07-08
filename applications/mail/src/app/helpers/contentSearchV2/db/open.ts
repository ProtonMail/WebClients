import { type IDBPDatabase, openDB } from 'idb';

import type { Database } from './schema.ts';

export function openContentSearchDB(userId: string): Promise<IDBPDatabase<Database>> {
    return openDB<Database>(`content_search_v2_user:${userId}`, 1, {
        upgrade: (db, oldVersion) => {
            if (oldVersion < 1) {
                db.createObjectStore('config');
                db.createObjectStore('index_blobs');
            }
        },
    });
}
