import type { Cached, CleanupEvent, ExportEvent, QueryEvent, WriteEvent } from '@proton/proton-foundation-search';
import { SerDes } from '@proton/proton-foundation-search';

import { Logger } from '../../shared/Logger';
import { decryptBlob, encryptBlob } from '../../shared/SearchCrypto';
import type { SearchDB } from '../../shared/SearchDB';
import { SEARCH_BLOB_CACHE_MAX_ENTRIES } from '../../shared/config';
import {
    SearchBlobCryptoError,
    createQuotaExceededErrorMessage,
    isQuotaExceededError,
    sendErrorReportForSearch,
} from '../../shared/errors';
import type { IndexKind } from './IndexRegistry';
import { maybeWrapAsSearchLibraryError } from './engineCall';

/**
 * Blob store backed by IndexedDB with a priority-bounded cache for WASM Cached objects.
 * Namespaced by IndexKind to isolate blobs between engines.
 *
 * Handles WASM engine blob events (load/save/release) and manages
 * the cache + DB persistence.
 */
export class IndexBlobStore {
    private cache = new Map<string, Cached>();

    // Cached objects whose .free() was deferred because a read or write was in flight when they
    // were evicted/superseded/released. Drained once the store goes idle again.
    private pendingFrees: Cached[] = [];

    // Number of blob-loading reads currently in flight.
    private activeReadCount = 0;

    // Number of write-session commits currently in flight.
    private activeWriteCount = 0;

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
        this.drainPendingFreesIfIdle();
    }

    /** Whether any blob-loading read is currently in flight. */
    hasActiveReads(): boolean {
        return this.activeReadCount > 0;
    }

    beginWrite(): void {
        this.activeWriteCount++;
    }

    endWrite(): void {
        this.activeWriteCount--;
        this.drainPendingFreesIfIdle();
    }

    /** Whether a write-session commit is currently in flight. */
    hasActiveWrites(): boolean {
        return this.activeWriteCount > 0;
    }

    private isBusy(): boolean {
        return this.hasActiveReads() || this.hasActiveWrites();
    }

    // A read or write may span multiple WASM engine steps and only borrows a Cached it was
    // handed via sendCached - freeing one out from under an in-flight operation would be a
    // use-after-free. Deferred frees are drained once the store goes idle again.
    private freeOrDefer(cached: Cached): void {
        if (this.isBusy()) {
            this.pendingFrees.push(cached);
            return;
        }
        this.freeCached(cached);
    }

    private freeCached(cached: Cached): void {
        try {
            cached.free();
        } catch (e) {
            sendErrorReportForSearch(
                `IndexBlobStore: failed to free cached blob`,
                maybeWrapAsSearchLibraryError('free cached blob', e),
                { tags: { indexKind: this.indexKind } }
            );
        }
    }

    private drainPendingFreesIfIdle(): void {
        if (this.isBusy() || this.pendingFrees.length === 0) {
            return;
        }
        const pending = this.pendingFrees;
        this.pendingFrees = [];
        for (const cached of pending) {
            this.freeCached(cached);
        }
    }

    // Cached.priority() is a WASM-supplied eviction hint: lower number = higher priority, so the
    // highest-numbered (lowest-priority) entry is evicted first. Ties fall back to insertion order
    // (the earliest-inserted of equal-priority entries goes first).
    private lowestPriorityKey(): string | undefined {
        let victim: string | undefined;
        let victimPriority = -Infinity;
        for (const [blobName, cached] of this.cache) {
            let priority: number;
            try {
                priority = cached.priority();
            } catch {
                // priority() is a WASM call reached from saveEvent. Letting it throw would fail a
                // save that already succeeded - and on behalf of some other blob. A handle we
                // cannot even read a priority from is the best eviction candidate there is.
                return blobName;
            }
            if (priority > victimPriority) {
                victimPriority = priority;
                victim = blobName;
            }
        }
        return victim;
    }

    /**
     * Take ownership of a decoded blob and keep it resident, evicting if that puts us over the cap.
     *
     * The delete before the set is not redundant: Map.set does not reorder an existing key, so
     * without it a frequently refreshed blob (the manifest) keeps the oldest slot and loses every
     * equal-priority tie-break, i.e. gets evicted first on every single overflow.
     */
    private admit(blobName: string, cached: Cached): void {
        const previous = this.cache.get(blobName);
        this.cache.delete(blobName);
        this.cache.set(blobName, cached);
        if (previous && previous !== cached) {
            // Superseded, not just overwritten in the map - the old handle still owns WASM memory.
            this.freeOrDefer(previous);
        }
        this.enforceCapacity();
    }

    private enforceCapacity(): void {
        while (this.cache.size > SEARCH_BLOB_CACHE_MAX_ENTRIES) {
            const blobName = this.lowestPriorityKey();
            if (blobName === undefined) {
                break;
            }
            const cached = this.cache.get(blobName);
            this.cache.delete(blobName);
            if (cached) {
                this.freeOrDefer(cached);
            }
        }
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
                // Admit the decoded blob so a later load skips the IndexedDB read and the AES-GCM
                // decrypt above. Deliberately not done for sendEmpty(): caching "absent" as a hit
                // would serve an empty blob forever and mask the storage corruption the engine
                // reports by refusing sendEmpty() on a required blob.
                this.admit(blobName, event.send(SerDes.Cbor, new Uint8Array(decrypted)));
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
            this.admit(blobName, cached);
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
            const cached = this.cache.get(blobName);
            this.cache.delete(blobName);
            if (cached) {
                this.freeOrDefer(cached);
            }
            await this.db.deleteIndexBlob(this.dbKey(blobName));
        } catch (e) {
            throw maybeWrapAsSearchLibraryError('release blob', e);
        }
    }

    /**
     * Snapshot of in-memory cache state, for search diagnostics reporting. `blobSizesInMb` is
     * ordered from highest priority (evicted last) to lowest (evicted first) - see
     * `Cached.priority()`. A blob whose `priority()`/`serialize()` itself throws is skipped rather
     * than failing the whole snapshot - same reasoning as `lowestPriorityKey()`.
     */
    getCacheStats(): { blobsCount: number; pendingFreeBlobsCount: number; blobSizesInMb: number[] } {
        const entries: { priority: number; sizeMb: number }[] = [];
        for (const cached of this.cache.values()) {
            try {
                const priority = cached.priority();
                const sizeMb = Math.round((cached.serialize(SerDes.Cbor).byteLength / 1024 / 1024) * 1000) / 1000;
                entries.push({ priority, sizeMb });
            } catch {
                continue;
            }
        }
        entries.sort((a, b) => a.priority - b.priority);

        return {
            blobsCount: this.cache.size,
            pendingFreeBlobsCount: this.pendingFrees.length,
            blobSizesInMb: entries.map((e) => e.sizeMb),
        };
    }

    /** Frees every blob still resident in the cache. Called when the owning engine is disposed. */
    disposeAll(): void {
        for (const cached of this.cache.values()) {
            this.freeCached(cached);
        }
        this.cache.clear();
        // Teardown is the last chance to release these: dropping the array instead would leak
        // every deferred blob, which is exactly the GC-dependency this cache is meant to remove.
        for (const cached of this.pendingFrees) {
            this.freeCached(cached);
        }
        this.pendingFrees = [];
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
