import type { Cached, CleanupEvent, QueryEvent, WriteEvent } from '@proton/proton-foundation-search';
import { SerDes } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';
import type { SearchDB } from '../../shared/SearchDB';
import { createQuotaExceededErrorMessage, isQuotaExceededError } from '../../shared/errors';
import type { IndexKind } from './IndexRegistry';

/**
 * Blob store backed by IndexedDB with a cache for WASM Cached objects.
 * Namespaced by IndexKind to isolate blobs between engines.
 *
 * Handles WASM engine blob events (load/save/release) and manages
 * the cache + DB persistence.
 */
export class IndexBlobStore {
    // TODO: Big indexes might not fit in memory and we might not just rely in a infinitely big
    //   cache. Monitor and replace by a sized scope cache (LRU).
    // TODO: Monitor cache hit per index kind.
    private cache = new Map<string, Cached>();

    constructor(
        private readonly indexKind: IndexKind,
        private readonly db: SearchDB
    ) {}

    private dbKey(blobName: string): [string, string] {
        return [this.indexKind, blobName];
    }

    async loadEvent(event: QueryEvent | WriteEvent | CleanupEvent): Promise<void> {
        const blobName = event.id().toString();
        const cached = this.cache.get(blobName);
        if (cached) {
            event.sendCached(cached);
            return;
        }

        const data = await this.db.getIndexBlob(this.dbKey(blobName));
        if (data !== undefined) {
            // TODO: Decrypt blobs, catch exceptions.
            event.send(SerDes.Cbor, new Uint8Array(data));
        } else {
            event.sendEmpty();
        }
    }

    async saveEvent(event: WriteEvent | CleanupEvent): Promise<void> {
        try {
            const blobName = event.id().toString();
            const cached = event.recv();
            const data = cached.serialize(SerDes.Cbor);
            // TODO: Encrypt blobs, catch exceptions.
            await this.db.putIndexBlob(this.dbKey(blobName), data.buffer as ArrayBuffer);
            this.cache.set(blobName, cached);
        } catch (e) {
            if (isQuotaExceededError(e)) {
                const msg = await createQuotaExceededErrorMessage();
                Logger.error(`IndexBlobStore: Quota exceeded error <${msg}>`);
            }
            throw e;
        }
    }

    async releaseEvent(event: CleanupEvent): Promise<void> {
        const blobName = event.id().toString();
        this.cache.delete(blobName);
        await this.db.deleteIndexBlob(this.dbKey(blobName));
    }

    async flushToStorage(): Promise<void> {
        /**
         * TODO: Once encryption is added, save/release will enqueue async
         * encrypt+write operations instead of awaiting them inline. This method
         * will await all pending writes, ensuring blobs are persisted properly
         * before various subscription cursors are saved.
         */
    }
}
