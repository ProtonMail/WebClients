import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';

/**
 * IndexedDB persistence for the encrypted thumbnail cache.
 *
 * One database per user ("thumbnail-cache:<userId>"), so entries and the wrapped
 * key are isolated between accounts sharing a browser. Stores AES-GCM ciphertext
 * (never plaintext). Eviction is FIFO, capped by total size, and applied
 * atomically with the metadata update in a single transaction.
 */

const DB_VERSION = 1;
const DATA_STORE = 'thumbnails';
const META_STORE = 'meta';

const METADATA_KEY = 'metadata';
const THUMBNAIL_ENCRYPTION_KEY = 'thumbnailEncryptionKey';

// The cache is intended for SD thumbnails (at most 64KB each, usually much less),
// so the 35MB budget holds roughly 500 of them. Caching HD / high-resolution
// images would blow past this quickly under any significant usage, so the cap
// would need revisiting if that ever changes.
const MAX_SIZE_MB = 35;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const dbName = (userId: string) => `thumbnail-cache:${userId}`;

/** A stored entry's key and ciphertext byte length, tracked so eviction never re-reads the data store. */
interface CacheEntry {
    key: string;
    size: number;
}

interface CacheMetadata {
    /** Entries in insertion order (oldest first), used for FIFO eviction. */
    queue: CacheEntry[];
    /** Total byte length of stored ciphertext. */
    totalSize: number;
}

interface ThumbnailCacheSchema extends DBSchema {
    [DATA_STORE]: {
        key: string;
        value: Uint8Array<ArrayBuffer>;
    };
    [META_STORE]: {
        key: string;
        value: CacheMetadata | string;
    };
}

type RawThumbnailCacheDB = IDBPDatabase<ThumbnailCacheSchema>;

const isMetadata = (value: CacheMetadata | string | undefined): value is CacheMetadata =>
    typeof value === 'object' && value !== null;

/**
 * Drops the oldest entries until the cache fits within the size cap.
 * Pure in-memory: it returns the trimmed metadata plus the keys whose
 * blobs the caller must delete.
 */
const evictToFit = (
    queue: CacheEntry[],
    totalSize: number
): { queue: CacheEntry[]; totalSize: number; evictedKeys: string[] } => {
    let evictCount = 0;
    let size = totalSize;
    while (size > MAX_SIZE_BYTES && evictCount < queue.length) {
        size -= queue[evictCount].size;
        evictCount += 1;
    }
    return {
        queue: queue.slice(evictCount),
        totalSize: size,
        evictedKeys: queue.slice(0, evictCount).map((entry) => entry.key),
    };
};

export class ThumbnailCacheDb {
    private constructor(private readonly db: RawThumbnailCacheDB) {}

    static async open(userId: string): Promise<ThumbnailCacheDb> {
        const db = await openDB<ThumbnailCacheSchema>(dbName(userId), DB_VERSION, {
            upgrade(database, oldVersion) {
                if (oldVersion < 1) {
                    database.createObjectStore(DATA_STORE);
                    database.createObjectStore(META_STORE);
                }
            },
        });
        return new ThumbnailCacheDb(db);
    }

    async getWrappedKey(): Promise<string | undefined> {
        const value = await this.db.get(META_STORE, THUMBNAIL_ENCRYPTION_KEY);
        return typeof value === 'string' ? value : undefined;
    }

    async setWrappedKey(wrapped: string): Promise<void> {
        await this.db.put(META_STORE, wrapped, THUMBNAIL_ENCRYPTION_KEY);
    }

    getEntry(cacheKey: string): Promise<Uint8Array<ArrayBuffer> | undefined> {
        return this.db.get(DATA_STORE, cacheKey);
    }

    /** Stores ciphertext, updating metadata and enforcing FIFO limits atomically. */
    async putEntry(cacheKey: string, ciphertext: Uint8Array<ArrayBuffer>): Promise<void> {
        const tx = this.db.transaction([DATA_STORE, META_STORE], 'readwrite');
        const data = tx.objectStore(DATA_STORE);
        const meta = tx.objectStore(META_STORE);

        const stored = await meta.get(METADATA_KEY);
        const metadata: CacheMetadata = isMetadata(stored) ? stored : { queue: [], totalSize: 0 };
        const queue = [...metadata.queue];
        let totalSize = metadata.totalSize;

        const existingIndex = queue.findIndex((entry) => entry.key === cacheKey);
        if (existingIndex !== -1) {
            totalSize -= queue[existingIndex].size;
            queue.splice(existingIndex, 1);
        }

        queue.push({ key: cacheKey, size: ciphertext.byteLength });
        totalSize += ciphertext.byteLength;
        await data.put(ciphertext, cacheKey);

        const trimmed = evictToFit(queue, totalSize);
        await Promise.all(trimmed.evictedKeys.map((key) => data.delete(key)));

        await meta.put({ queue: trimmed.queue, totalSize: trimmed.totalSize }, METADATA_KEY);
        await tx.done;
    }

    /** Clears cached thumbnails and resets metadata; the wrapped key is left intact. */
    async clearData(): Promise<void> {
        const tx = this.db.transaction([DATA_STORE, META_STORE], 'readwrite');
        await tx.objectStore(DATA_STORE).clear();
        await tx.objectStore(META_STORE).put({ queue: [], totalSize: 0 }, METADATA_KEY);
        await tx.done;
    }

    close(): void {
        this.db.close();
    }
}
