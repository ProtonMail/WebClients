import type { Cached, CleanupEvent, ExportEvent, QueryEvent, WriteEvent } from '@proton/proton-foundation-search';
import { SerDes } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';
import { decryptBlob, encryptBlob } from '../../shared/SearchCrypto';
import type { SearchDB } from '../../shared/SearchDB';
import { SearchBlobCryptoError, createQuotaExceededErrorMessage, isQuotaExceededError } from '../../shared/errors';
import type { IndexKind } from './IndexRegistry';
import { maybeWrapAsSearchLibraryError } from './engineCall';

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
    private cache = new Map<string, Cached>();

    // Number of blob-loading reads currently in flight.
    private activeReadCount = 0;

    constructor(
        private readonly indexKind: IndexKind,
        private readonly db: SearchDB,
        private readonly cryptoKey: CryptoKey
    ) {}

    private dbKey(blobName: string): [string, string] {
        return [this.indexKind, blobName];
    }

    beginRead(): void {
        this.activeReadCount++;
    }

    endRead(): void {
        this.activeReadCount--;
    }

    /** Whether any blob-loading read is currently in flight. */
    hasActiveReads(): boolean {
        return this.activeReadCount > 0;
    }

    async loadEvent(event: QueryEvent | WriteEvent | CleanupEvent | ExportEvent): Promise<void> {
        try {
            const blobName = event.id().toString();
            const cached = this.cache.get(blobName);

            if (cached) {
                event.sendCached(cached);
                return;
            }

            const decrypted = await this.db.getDecryptedIndexBlob(this.dbKey(blobName), async (ciphertext) => {
                try {
                    const result = await decryptBlob(this.cryptoKey, ciphertext, this.indexKind, blobName);
                    return result.buffer;
                } catch (e) {
                    throw new SearchBlobCryptoError(e);
                }
            });
            if (decrypted !== undefined) {
                event.send(SerDes.Cbor, new Uint8Array(decrypted));
            } else {
                event.sendEmpty();
            }
        } catch (e) {
            throw maybeWrapAsSearchLibraryError('load blob', e);
        }
    }

    async saveEvent(event: WriteEvent | CleanupEvent): Promise<void> {
        try {
            const blobName = event.id().toString();
            const cached = event.recv();
            const serialized = cached.serialize(SerDes.Cbor);

            await this.db.putEncryptedIndexBlob(
                this.dbKey(blobName),
                new Uint8Array(serialized).buffer,
                async (plaintext) => {
                    try {
                        return await encryptBlob(this.cryptoKey, new Uint8Array(plaintext), this.indexKind, blobName);
                    } catch (e) {
                        throw new SearchBlobCryptoError(e);
                    }
                }
            );
            this.cache.set(blobName, cached);
        } catch (e) {
            if (isQuotaExceededError(e)) {
                const msg = await createQuotaExceededErrorMessage();
                Logger.error(`IndexBlobStore: Quota exceeded error <${msg}>`);
            }
            throw maybeWrapAsSearchLibraryError('save blob', e);
        }
    }

    async releaseEvent(event: CleanupEvent): Promise<void> {
        try {
            const blobName = event.id().toString();
            this.cache.delete(blobName);
            await this.db.deleteIndexBlob(this.dbKey(blobName));
        } catch (e) {
            throw maybeWrapAsSearchLibraryError('release blob', e);
        }
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
