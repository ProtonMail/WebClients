import type { IDBPDatabase } from 'idb';

import type { CleanupEvent, Write } from '@proton/proton-foundation-search';
import { CleanupEventKind, Document, type WriteEvent } from '@proton/proton-foundation-search';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage } from 'proton-mail/models/encryptedSearch.ts';

import { BlobCache } from '../cache/BlobCache';
import { EncryptedBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { KeyManager } from '../crypto/KeyManager';
import { openContentSearchDB } from '../db/open';
import type { Database } from '../db/schema';
import { createMailSearchEngine } from '../engine/create';
import { isLoadEvent, isReleaseEvent, isSaveEvent } from '../utils/eventTypeGuards';
import { MailDelegate } from './MailDelegate';

type Message = { metadata: ESBaseMessage; body: string };

export class IndexWriter {
    private delegate = new MailDelegate();
    private readonly engine = createMailSearchEngine();
    private blobCache = new BlobCache();

    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey
    ) {}

    static async open(userId: string, userKeys: DecryptedKey[]): Promise<IndexWriter> {
        const db = await openContentSearchDB(userId);
        const keyManager = new KeyManager(userKeys, db);
        const key = await keyManager.getKey();
        return new IndexWriter(db, key);
    }

    dispose() {
        this.db.close();
        this.blobCache.free();
    }

    async cleanup(signal?: AbortSignal): Promise<void> {
        const cleanup = this.engine.cleanup();
        if (!cleanup) {
            throw new Error("can't cleanup, other operation in progress");
        }
        const blobTxn = await EncryptedBlobTransaction.start(this.blobCache, this.db, this.indexKey);
        let event: CleanupEvent | undefined;
        try {
            while ((event = cleanup.next())) {
                signal?.throwIfAborted();
                if (isLoadEvent(event)) {
                    await blobTxn.handleLoadEvent(event);
                    signal?.throwIfAborted();
                } else if (isReleaseEvent(event)) {
                    blobTxn.handleReleaseEvent(event);
                } else if (isSaveEvent(event)) {
                    blobTxn.handleSaveEvent(event);
                } else if (event.kind() === CleanupEventKind.Tracked) {
                    blobTxn.trackBlob(event.id().toString());
                }
            }
        } finally {
            cleanup.free();
        }
        await blobTxn.encrypt();
        signal?.throwIfAborted();
        const txn = this.db.transaction(['config', 'index_blobs'], 'readwrite');
        try {
            await blobTxn.verifyAndWriteAndDeleteUntracked(txn);
        } catch (err) {
            txn.abort();
            throw err;
        }
        await txn.done;
    }

    async clear() {
        const txn = this.db.transaction(['config', 'index_blobs'], 'readwrite');
        //eslint-disable-next-line @typescript-eslint/no-floating-promises -- no need to await delete, txn.done is enough
        txn.objectStore('config').delete('blobs_revision');
        //eslint-disable-next-line @typescript-eslint/no-floating-promises -- no need to await clear, txn.done is enough
        txn.objectStore('index_blobs').clear();
        await txn.done;
    }

    async writeBatch(messages: Message[], abortSignal?: AbortSignal) {
        abortSignal?.throwIfAborted();
        const writer = this.addMessagesToWriter(messages);
        const blobTxn = await EncryptedBlobTransaction.start(this.blobCache, this.db, this.indexKey);
        abortSignal?.throwIfAborted();
        const execution = writer.commit();
        try {
            let event: WriteEvent | undefined;
            while ((event = execution.next())) {
                if (isLoadEvent(event)) {
                    await blobTxn.handleLoadEvent(event);
                    abortSignal?.throwIfAborted();
                } else if (isSaveEvent(event)) {
                    blobTxn.handleSaveEvent(event);
                }
            }
        } finally {
            execution.free();
        }
        await blobTxn.encrypt();
        abortSignal?.throwIfAborted();
        const txn = this.db.transaction(['config', 'index_blobs'], 'readwrite');
        try {
            await blobTxn.verifyAndWrite(txn);
        } catch (err) {
            txn.abort();
            throw err;
        }
        await txn.done;
    }

    private addMessagesToWriter(messages: Message[]): Write {
        const writer = this.engine.write();
        if (!writer) {
            throw new Error('could not write');
        }
        try {
            for (const message of messages) {
                const doc = new Document(message.metadata.ID);
                this.delegate.stageMetadata(message.metadata, doc);
                this.delegate.stageBody(message.body, doc);
                writer.insert(doc);
            }
        } catch (err) {
            writer.free();
            throw err;
        }
        return writer;
    }
}
