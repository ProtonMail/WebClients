import { decryptData, encryptData } from '@protontech/crypto/subtle/aesGcm.ts';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';
import type { IDBPDatabase } from 'idb';

import type { MIME_TYPES } from '@proton/shared/lib/constants';

import type { ESBaseMessage } from '../../models/encryptedSearch';
import type { Database, DatabaseStores, ReadWriteTransaction } from '../db/schema';

export type MessageCacheContent = {
    decryptedBody: string;
    decryptedSubject?: string;
    mimeType: MIME_TYPES | undefined;
};
export type MessageCacheEntry = ESBaseMessage & MessageCacheContent;

/**
 * AES-GCM additional authenticated data for message cache entries, to bind the ciphertext to the message id
 */
const getMessageCacheEncryptionContext = (id: string) =>
    utf8StringToUint8Array(`mail.search.index.message_cache.${id}`);

/** The open phase of a message cache transaction, where changes can be queued.
 * `encrypt()` consumes it and returns the {@link SealedMessageCacheTransaction}.
 * @public */
export type OpenMessageCacheTransaction = Omit<MessageCacheTransaction, 'write'>;
/** The sealed phase, where all entries have been encrypted and all that is left is to write them.
 * @public */
export type SealedMessageCacheTransaction = Pick<MessageCacheTransaction, 'write'>;

/** Queues changes to the message cache in memory, so they can be written in the same
 * idb transaction as the index blobs (see {@link EncryptedBlobTransaction}). As web crypto is async
 * and would auto-commit any open idb transaction, all reading, decrypting and encrypting happens in
 * `encrypt()`, prior to opening the idb transaction passed to `write()`. */
class MessageCacheTransaction implements OpenMessageCacheTransaction, SealedMessageCacheTransaction {
    /** messages added or replaced in this transaction */
    private addedEntries = new Map<string, MessageCacheEntry>();
    /** messages for which only the metadata is updated, keeping the cached body */
    private metadataUpdates = new Map<string, ESBaseMessage>();
    /** message ids removed in this transaction */
    private removedIds = new Set<string>();
    /** encrypted version of addedEntries and metadataUpdates, set by encrypt() */
    private encryptedEntries: Map<string, Uint8Array<ArrayBuffer>> | undefined;
    /** encrypt has been called, can't queue more changes */
    private consumed = false;
    private readonly utf8Encoder = new TextEncoder();

    constructor(
        private readonly indexKey: CryptoKey,
        private readonly messageCache: MessageCache
    ) {}

    private assertNotConsumed() {
        if (this.consumed) {
            throw new Error('transaction has been consumed');
        }
    }

    /** add or replace a message in the cache */
    addMessage(entry: MessageCacheEntry) {
        this.assertNotConsumed();
        this.addedEntries.set(entry.ID, entry);
        // superseded by the full entry
        this.metadataUpdates.delete(entry.ID);
        this.removedIds.delete(entry.ID);
    }

    /** update the metadata of a message already in the cache, keeping the cached body.
     * Ignored if the message is not in the cache. */
    updateMetadata(metadata: ESBaseMessage) {
        this.assertNotConsumed();
        const id = metadata.ID;
        // nothing to update if the message was removed earlier in this transaction
        if (this.removedIds.has(id)) {
            return;
        }
        const added = this.addedEntries.get(id);
        if (added) {
            this.addedEntries.set(id, { ...added, ...metadata });
        } else {
            this.metadataUpdates.set(id, { ...this.metadataUpdates.get(id), ...metadata });
        }
    }

    removeMessage(id: string) {
        this.assertNotConsumed();
        this.removedIds.add(id);
        this.addedEntries.delete(id);
        this.metadataUpdates.delete(id);
    }

    /** reads and decrypts any messages for which only the metadata is updated, merges the new metadata
     * and encrypts all entries to write. Should be called before opening the idb transaction passed to
     * `write`, as web crypto would auto-commit it. */
    async encrypt(db: IDBPDatabase<Database>): Promise<SealedMessageCacheTransaction> {
        this.assertNotConsumed();
        this.consumed = true;
        const entriesToWrite = Array.from(this.addedEntries.values());
        if (this.metadataUpdates.size !== 0) {
            const existingEntries = await this.messageCache.readMessages(Array.from(this.metadataUpdates.keys()), db);
            for (const [id, metadata] of this.metadataUpdates) {
                const existing = existingEntries.get(id);
                if (existing) {
                    entriesToWrite.push({ ...existing, ...metadata });
                }
            }
        }
        const encryptedEntries = await Promise.all(
            entriesToWrite.map(async (entry): Promise<[string, Uint8Array<ArrayBuffer>]> => {
                return [entry.ID, await this.encryptEntry(entry)];
            })
        );
        this.encryptedEntries = new Map(encryptedEntries);
        return this;
    }

    private async encryptEntry(entry: MessageCacheEntry): Promise<Uint8Array<ArrayBuffer>> {
        const plaintext = this.utf8Encoder.encode(JSON.stringify(entry));
        return encryptData(this.indexKey, plaintext, getMessageCacheEncryptionContext(entry.ID));
    }

    /** writes all changes as part of the given idb transaction */
    write<Stores extends DatabaseStores>(txn: ReadWriteTransaction<Stores, 'message_cache'>) {
        if (!this.encryptedEntries) {
            throw new Error('Call encrypt() first');
        }
        const store = txn.objectStore('message_cache');
        for (const [id, value] of this.encryptedEntries) {
            // no need to await put, txn.done is enough
            void store.put(value, id);
        }
        for (const id of this.removedIds) {
            // no need to await delete, txn.done is enough
            void store.delete(id);
        }
    }
}

/** the index only returns matching message ids. The message cache stores
the full message so we can display it in the search results without fetching
the messages from the server. It is populated while indexing. */
export class MessageCache {
    private readonly utf8Decoder = new TextDecoder();

    constructor(private readonly indexKey: CryptoKey) {}

    /** start a transaction to queue changes to the message cache, which can be
     * written as part of the same idb transaction as the index blobs. */
    startTransaction(): OpenMessageCacheTransaction {
        return new MessageCacheTransaction(this.indexKey, this);
    }

    async readMessages(ids: string[], db: IDBPDatabase<Database>): Promise<Map<string, MessageCacheEntry>> {
        const txn = db.transaction('message_cache', 'readonly');
        const store = txn.objectStore('message_cache');
        const entries = await Promise.all(ids.map((id) => store.get(id)));
        const decryptedEntries = (
            await Promise.all(
                ids.map(async (id, i) => {
                    const entry = entries[i];
                    if (!entry) {
                        return;
                    }
                    return this.decryptEntry(id, entry);
                })
            )
        ).filter((e) => e !== undefined);
        return new Map(decryptedEntries.map((e) => [e.ID, e]));
    }

    private async decryptEntry(id: string, ciphertext: Uint8Array<ArrayBuffer>): Promise<MessageCacheEntry> {
        const plaintext = await decryptData(this.indexKey, ciphertext, getMessageCacheEncryptionContext(id));
        return JSON.parse(this.utf8Decoder.decode(plaintext)) as MessageCacheEntry;
    }
}
