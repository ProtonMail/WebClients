import { decryptData, encryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';
import type { IDBPDatabase, IDBPObjectStore } from 'idb';

import type { CleanupEvent, ExportEvent, QueryEvent, WriteEvent } from '@proton/proton-foundation-search';
import { SerDes } from '@proton/proton-foundation-search';

import type { BlobCache } from '../cache/BlobCache';
import type { Database, DatabaseStores, ReadTransaction, ReadWriteTransaction } from '../db/schema';
import type { Kind, OfKind } from '../utils/eventTypeGuards';

/** The open, event-handling phase of a blob transaction. This is what {@link EncryptedBlobTransaction.start}
 * hands back: you stage changes by feeding it events, then `encrypt()` *consumes* it and returns the
 * {@link SealedBlobTransaction}. Because `verifyAndWrite` lives on the sealed type and not here, you can't
 * write before encrypting; because the event methods live here and not on the sealed type, you can't stage
 * more changes after. */
export type OpenBlobTransaction = Omit<EncryptedBlobTransaction, 'verifyAndWrite'>;

/** The sealed, write-ready phase: the blobs have been encrypted and all that is left is to verify the
 * revision hasn't changed and write. The only way to obtain one is `encrypt()`, which is what guarantees
 * at the type level that encryption happened first and that no more events can be handled. */
export type SealedBlobTransaction = Pick<EncryptedBlobTransaction, 'verifyAndWrite'>;

/**
 * AES-GCM additional authenticated data for index blobs, to bind the ciphertext to the blob id
 */
export const getBlobEncryptionContext = (blobId: string) => utf8StringToUint8Array(`mail.search.index.blob.${blobId}`);

/** This class deals with the fact that idb transactions are interrupted by the async nature of webcrypto.
 * It reads the current revision number when it starts, and verifies that it is still the same when
 * verifying the transaction once done. If the revision has changed, it would mean that some other
 * EncryptedBlobTransaction wrote to the database and that our reads were potentially based off different
 * states of the database, giving an inconsistent view. Normally, one would use idb transactions for this,
 * but because we have to encrypt blobs prior to writing them to indexeddb, and webcrypto being async, our
 * idb transaction would get auto-committed. So we keep all changes in memory (writes, deletes),
 * then encrypt the writes using web crypto, and then write everything in one idb transaction after
 * confirming that the revision hasn't changed.
 */
export class EncryptedBlobTransaction implements OpenBlobTransaction, SealedBlobTransaction {
    /** blobs that are modified in this transaction, kept in memory for the lifetime of the transaction */
    private writtenBlobs = new Map<string, Uint8Array<ArrayBuffer>>();
    /** encrypted version of the above map. If blobs are added to the above after encrypting,
     *  this one is cleared as it is out of date */
    private encryptedBlobsToWrite: Map<string, Uint8Array<ArrayBuffer>> | undefined;
    /** blobs ids that are confirmed to still be needed in the index during a cleanup.
     *  anything not tracked will be deleted during verifyAndWriteAndDeleteUntracked */
    private trackedBlobIds = new Set<string>();
    /** blob ids that are deleted during this transaction */
    private deleteBlobIds = new Set<string>();
    /** encrypt has been called, can't apply more changes */
    private consumed = false;

    private constructor(
        private cache: BlobCache | undefined,
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey,
        private revision: number
    ) {}

    static async start(
        cache: BlobCache | undefined,
        db: IDBPDatabase<Database>,
        indexKey: CryptoKey
    ): Promise<OpenBlobTransaction> {
        const revision = await EncryptedBlobTransaction.readRevision(db.transaction('config').store);
        return new EncryptedBlobTransaction(cache, db, indexKey, revision);
    }

    private assertNotConsumed() {
        if (this.consumed) {
            throw new Error('transaction has been consumed');
        }
    }

    async handleLoadEvent(event: OfKind<QueryEvent | WriteEvent | ExportEvent | CleanupEvent, typeof Kind.Load>) {
        this.assertNotConsumed();
        const id = event.id().toString();
        const cached = this.cache?.get(id);
        if (cached) {
            event.sendCached(cached);
        } else {
            const blob = await this.readBlobFromPersistence(id);
            if (blob) {
                const cached = event.send(SerDes.Cbor, blob);
                this.cache?.set(id, cached);
            } else {
                event.sendEmpty();
            }
        }
    }

    private async readBlobFromPersistence(id: string): Promise<Uint8Array<ArrayBuffer> | undefined> {
        // first look for any blobs that are touched in this transaction so far.
        // don't return anything if a blob is scheduled for deletion,
        // regardless of whether it exists in storage
        if (this.deleteBlobIds.has(id)) {
            return;
        }
        // return any blobs that were previously written in this txn but not committed yet
        const written = this.writtenBlobs.get(id);
        if (written) {
            return written;
        }
        const blobRecord = await this.db.get('index_blobs', id);
        if (!blobRecord) {
            return;
        }
        const decrypted = await decryptData(this.indexKey, blobRecord, getBlobEncryptionContext(id));
        return decrypted;
    }

    handleSaveEvent(event: OfKind<CleanupEvent | WriteEvent, typeof Kind.Save>) {
        this.assertNotConsumed();
        const id = event.id().toString();
        const cached = event.recv();
        this.cache?.set(id, cached);
        const blob = cached.serialize(SerDes.Cbor) as Uint8Array<ArrayBuffer>;
        this.writtenBlobs.set(id, blob);
        // clear any already encrypted blobs, if writeBlob happens to be called after encrypt(),
        // which typically it shouldn't. this just ensures we don't miss any blobs when
        // writing the encrypted ones to disk.
        this.encryptedBlobsToWrite = undefined;
    }

    handleReleaseEvent(event: OfKind<CleanupEvent, typeof Kind.Release>) {
        this.assertNotConsumed();
        const id = event.id().toString();
        this.cache?.delete(id);
        this.deleteBlobIds.add(id);
    }

    trackBlob(id: string) {
        this.assertNotConsumed();
        this.trackedBlobIds.add(id);
    }

    /** should be called after all modifications have been made, before verifyAndWrite.
     * No idb transactions should be open, as web crypto being async will auto-commit them.
     * This returns the interface that allows writing, to enforce not calling
     * verifyAndWrite without calling encrypt. */
    async encrypt(): Promise<SealedBlobTransaction> {
        this.assertNotConsumed();
        this.consumed = true;
        const encryptedEntries = await Promise.all(
            Array.from(this.writtenBlobs.entries()).map(
                async ([id, buffer]): Promise<[string, Uint8Array<ArrayBuffer>]> => {
                    const ciphertext = await encryptData(this.indexKey, buffer, getBlobEncryptionContext(id));
                    return [id, ciphertext];
                }
            )
        );
        this.encryptedBlobsToWrite = new Map(encryptedEntries);
        return this;
    }

    /** verifies the transaction is still valid, writes all changes
     * we accept a idb transaction rather than starting our own, so the changes
     * in here can be written as part of a larger idb transaction,
     * often useful to commit related changes together.
     */
    async verifyAndWrite<Stores extends DatabaseStores>(txn: ReadWriteTransaction<Stores, 'config' | 'index_blobs'>) {
        if (this.encryptedBlobsToWrite?.size !== this.writtenBlobs.size) {
            throw new Error('Call encrypt() first');
        }
        await this.verifyInternal(txn);
        const blobStore = txn.objectStore('index_blobs');
        for (const [id, blob] of this.encryptedBlobsToWrite.entries()) {
            // no need to await put, txn.done is enough
            void blobStore.put(blob, id);
        }
        for (const id of this.deleteBlobIds) {
            // no need to await delete, txn.done is enough
            void blobStore.delete(id);
        }
        //  no need to await put, txn.done is enough
        void txn.objectStore('config').put(this.revision + 1, 'blobs_revision');
        // if tracking blobs, remove any that are not tracked.
        // this check should never prevent cleaning up as
        // at least the metadata blob will always be tracked
        if (this.trackedBlobIds.size !== 0) {
            let keyCursor = await blobStore.openKeyCursor();
            while (keyCursor) {
                if (!this.trackedBlobIds.has(keyCursor.key as string)) {
                    // Delete via the store, not the cursor: a key-only cursor (openKeyCursor) is not
                    // allowed to delete() per the IndexedDB spec and throws InvalidStateError.
                    // no need to await delete, txn.done at end is enough
                    void blobStore.delete(keyCursor.key);
                }
                keyCursor = await keyCursor.continue();
            }
        }
    }

    /** should only be used for readonly transactions, where aborting does not make sense */
    verify<Stores extends DatabaseStores>(txn: ReadTransaction<Stores, 'config'>): Promise<void> {
        return this.verifyInternal(txn);
    }

    private async verifyInternal<Stores extends DatabaseStores>(txn: ReadTransaction<Stores, 'config'>): Promise<void> {
        const currentRevision = await EncryptedBlobTransaction.readRevision(txn.objectStore('config'));
        if (currentRevision !== this.revision) {
            throw new Error(
                `index_blobs revision changed from ${this.revision} to ${currentRevision} while doing crypto`
            );
        }
    }

    private static async readRevision(
        store: IDBPObjectStore<Database, any, 'config', 'readonly' | 'readwrite'>
    ): Promise<number> {
        return ((await store.get('blobs_revision')) as number | undefined) ?? 0;
    }
}
