import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';

import { BACKGROUNDS_DB_NAME, BACKGROUNDS_DB_VERSION, IMAGE_CACHE_MAX_BYTES } from '../constants';
import type { BackgroundRecord } from '../types';

/**
 * IndexedDB persistence for custom backgrounds.
 *
 * One database for every namespace rather than one per user, since the guest namespace has no account
 * behind it; isolation comes from the keys the ciphertext is encrypted to, not from the row it sits in.
 * Records are keyed on `[namespace, id]` with a `namespace` index, so a namespace can be listed or
 * dropped in one range.
 */

const RECORD_STORE = 'records';
const IMAGE_LRU_STORE = 'imageLru';
const NAMESPACE_INDEX = 'namespace';

interface ImageLruEntry {
    id: string;
    size: number;
}

interface ImageLru {
    namespace: string;
    /** Image entries in least-recently-used order (oldest first). */
    queue: ImageLruEntry[];
}

interface BackgroundsDbSchema extends DBSchema {
    [RECORD_STORE]: {
        key: [string, string];
        value: BackgroundRecord;
        indexes: { [NAMESPACE_INDEX]: string };
    };
    [IMAGE_LRU_STORE]: {
        key: string;
        value: ImageLru;
    };
}

const queueWithout = (queue: ImageLruEntry[], id: string) => queue.filter((entry) => entry.id !== id);

const queueSize = (queue: ImageLruEntry[]) => queue.reduce((sum, entry) => sum + entry.size, 0);

export class BackgroundCacheDb {
    private constructor(private readonly db: IDBPDatabase<BackgroundsDbSchema>) {}

    static async open(): Promise<BackgroundCacheDb> {
        const db = await openDB<BackgroundsDbSchema>(BACKGROUNDS_DB_NAME, BACKGROUNDS_DB_VERSION, {
            upgrade(database, oldVersion) {
                if (oldVersion < 1) {
                    const records = database.createObjectStore(RECORD_STORE, { keyPath: ['namespace', 'id'] });
                    records.createIndex(NAMESPACE_INDEX, 'namespace');
                    database.createObjectStore(IMAGE_LRU_STORE, { keyPath: 'namespace' });
                }
            },
        });

        return new BackgroundCacheDb(db);
    }

    listRecords(namespace: string): Promise<BackgroundRecord[]> {
        return this.db.getAllFromIndex(RECORD_STORE, NAMESPACE_INDEX, namespace);
    }

    getRecord(namespace: string, id: string): Promise<BackgroundRecord | undefined> {
        return this.db.get(RECORD_STORE, [namespace, id]);
    }

    /**
     * Writes a record and brings the namespace back under the image cap in the same transaction.
     * Eviction strips the `image` field of a record Drive can serve again, so the tile keeps drawing
     * and applying it re-downloads; a record with no revision behind it is dropped whole instead.
     */
    async putRecord(record: BackgroundRecord): Promise<void> {
        const tx = this.db.transaction([RECORD_STORE, IMAGE_LRU_STORE], 'readwrite');
        const records = tx.objectStore(RECORD_STORE);
        const imageLru = tx.objectStore(IMAGE_LRU_STORE);

        await records.put(record);

        const stored = await imageLru.get(record.namespace);
        const queue = queueWithout(stored?.queue ?? [], record.id);

        if (record.image) {
            queue.push({ id: record.id, size: record.image.byteLength });
        }

        let size = queueSize(queue);

        // The entry just written is never the one evicted, however large it is.
        while (size > IMAGE_CACHE_MAX_BYTES && queue.length > 1) {
            const [evicted] = queue.splice(0, 1);

            size -= evicted.size;

            const stale = await records.get([record.namespace, evicted.id]);

            if (!stale) {
                continue;
            }

            // Without a revision to download again, the image is the only copy there is, and a record
            // left without one is a tile the user could never apply, so the row goes with it.
            if (stale.revisionUid) {
                await records.put({ ...stale, image: undefined });
            } else {
                await records.delete([record.namespace, evicted.id]);
            }
        }

        await imageLru.put({ namespace: record.namespace, queue });
        await tx.done;
    }

    /** Moves an image to the most-recently-used end, so applying a background protects it. */
    async touchImage(namespace: string, id: string): Promise<void> {
        const tx = this.db.transaction(IMAGE_LRU_STORE, 'readwrite');
        const stored = await tx.store.get(namespace);
        const entry = stored?.queue.find((candidate) => candidate.id === id);

        if (stored && entry) {
            await tx.store.put({ namespace, queue: [...queueWithout(stored.queue, id), entry] });
        }

        await tx.done;
    }

    async deleteRecord(namespace: string, id: string): Promise<void> {
        const tx = this.db.transaction([RECORD_STORE, IMAGE_LRU_STORE], 'readwrite');
        const imageLru = tx.objectStore(IMAGE_LRU_STORE);

        await tx.objectStore(RECORD_STORE).delete([namespace, id]);

        const stored = await imageLru.get(namespace);

        if (stored) {
            await imageLru.put({ namespace, queue: queueWithout(stored.queue, id) });
        }

        await tx.done;
    }

    async deleteNamespace(namespace: string): Promise<void> {
        const tx = this.db.transaction([RECORD_STORE, IMAGE_LRU_STORE], 'readwrite');
        const records = tx.objectStore(RECORD_STORE);
        const keys = await records.index(NAMESPACE_INDEX).getAllKeys(namespace);

        await Promise.all(keys.map((key) => records.delete(key)));
        await tx.objectStore(IMAGE_LRU_STORE).delete(namespace);
        await tx.done;
    }

    /** Both stores, so a namespace left with only image bookkeeping still reports itself. */
    async listNamespaces(): Promise<string[]> {
        const recordKeys = await this.db.getAllKeys(RECORD_STORE);
        const imageLruKeys = await this.db.getAllKeys(IMAGE_LRU_STORE);

        return [...new Set([...recordKeys.map(([namespace]) => namespace), ...imageLruKeys])];
    }

    close(): void {
        this.db.close();
    }
}
