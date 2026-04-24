import type { Cached, CleanupEvent, ExportEvent, QueryEvent, WriteEvent } from '@proton/proton-foundation-search';
import { SerDes } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';
import { decryptBlob, encryptBlob } from '../../shared/SearchCrypto';
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
        private readonly db: SearchDB,
        private readonly cryptoKey: CryptoKey
    ) {}

    private dbKey(blobName: string): [string, string] {
        return [this.indexKind, blobName];
    }

    async loadEvent(event: QueryEvent | WriteEvent | CleanupEvent | ExportEvent): Promise<void> {
        const blobName = event.id().toString();
        const cached = this.cache.get(blobName);
        if (cached) {
            event.sendCached(cached);
            return;
        }

        // TODO: Instrument and exception handling hardening for failed decryptions.
        const decrypted = await this.db.getDecryptedIndexBlob(this.dbKey(blobName), async (ciphertext) => {
            const result = await decryptBlob(this.cryptoKey, ciphertext, this.indexKind, blobName);
            return result.buffer;
        });
        if (decrypted !== undefined) {
            event.send(SerDes.Cbor, new Uint8Array(decrypted));
        } else {
            event.sendEmpty();
        }
    }

    async saveEvent(event: WriteEvent | CleanupEvent): Promise<void> {
        try {
            const blobName = event.id().toString();
            const cached = event.recv();
            const serialized = cached.serialize(SerDes.Cbor);
            // TODO: Instrument and exception handling hardening for failed encryptions.
            await this.db.putEncryptedIndexBlob(this.dbKey(blobName), new Uint8Array(serialized).buffer, (plaintext) =>
                encryptBlob(this.cryptoKey, new Uint8Array(plaintext), this.indexKind, blobName)
            );
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
