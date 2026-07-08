import { decryptData, encryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import type { IDBPDatabase, IDBPObjectStore, IDBPTransaction } from 'idb';

import type { Database } from '../db/schema.ts';

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
export class EncryptedBlobTransaction {
    // blobs that are modified in this transaction, kept in memory for the lifetime of the transaction
    private writtenBlobs = new Map<string, Uint8Array<ArrayBuffer>>();
    // encrypted version of the above map. If blobs are added to the above after encrypting,
    // this one is cleared as it is out of date
    private encryptedBlobsToWrite: Map<string, Uint8Array<ArrayBuffer>> | undefined;
    // blobs ids that are confirmed to still be needed in the index during a cleanup.
    // anything not tracked will be deleted during verifyAndWriteAndDeleteUntracked
    private trackedBlobIds = new Set<string>();
    // blob ids that are deleted during this transaction
    private deleteBlobIds = new Set<string>();

    // TODO: consider keeping blob cache in here, scope is perfect

    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey,
        private revision: number
    ) {}

    static async start(db: IDBPDatabase<Database>, indexKey: CryptoKey) {
        const revision = await EncryptedBlobTransaction.readRevision(db.transaction('config').store);
        return new EncryptedBlobTransaction(db, indexKey, revision);
    }

    async readBlob(id: string): Promise<Uint8Array<ArrayBuffer> | undefined> {
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
        const decrypted = await decryptData(this.indexKey, blobRecord);
        return decrypted;
    }

    deleteBlob(id: string) {
        this.deleteBlobIds.add(id);
    }

    trackBlob(id: string) {
        this.trackedBlobIds.add(id);
    }

    writeBlob(id: string, blob: Uint8Array<ArrayBuffer>) {
        this.writtenBlobs.set(id, blob);
        // clear any already encrypted blobs, if writeBlob happens to be called after encrypt(),
        // which typically it shouldn't. this just ensures we don't miss any blobs when
        // writing the encrypted ones to disk.
        this.encryptedBlobsToWrite = undefined;
    }

    /** should be called after all modifications have been made, before verifyAndWrite.
     * No idb transactions should be open, as web crypto being async will auto-commit them. */
    async encrypt(): Promise<void> {
        const encryptedEntries = await Promise.all(
            Array.from(this.writtenBlobs.entries()).map(
                async ([id, buffer]): Promise<[string, Uint8Array<ArrayBuffer>]> => {
                    const ciphertext = await encryptData(this.indexKey, buffer);
                    return [id, ciphertext];
                }
            )
        );
        this.encryptedBlobsToWrite = new Map(encryptedEntries);
    }

    /** verifies the transaction is still valid, writes all changes
     * we accept a idb transaction rather than starting our own, so the changes
     * in here can be written as part of a larger idb transaction,
     * often useful to commit related changes together.
     */
    async verifyAndWrite(txn: IDBPTransaction<Database, any, 'readwrite'>) {
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
    }
    /** verifies the transaction is still valid, writes all changes,
     * and also deletes and blobs that haven't been tracked with `trackBlob`.
     * Only needed during cleanup.
     * Quite a mouthful but very explicit on purpose, don't want to
     * make this part of verifyAndWrite because when not all blobs
     * are tracked this could deleted blobs that are still in use. */
    async verifyAndWriteAndDeleteUntracked(txn: IDBPTransaction<Database, any, 'readwrite'>) {
        await this.verifyAndWrite(txn);
        if (this.trackedBlobIds.size === 0) {
            throw new Error('no blobs are tracked, this would delete all blobs');
        }
        let keyCursor = await txn.objectStore('index_blobs').openKeyCursor();
        while (keyCursor) {
            if (!this.trackedBlobIds.has(keyCursor.key as string)) {
                // no need to await delete, txn.done at end is enough
                void keyCursor.delete();
            }
            keyCursor = await keyCursor.continue();
        }
    }

    /** should only be used for readonly transactions, where aborting does not make sense */
    verify(txn: IDBPTransaction<Database, any, 'readonly'>): Promise<void> {
        return this.verifyInternal(txn);
    }

    private async verifyInternal(txn: IDBPTransaction<Database, any, any>): Promise<void> {
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
