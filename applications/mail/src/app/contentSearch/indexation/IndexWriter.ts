import type { IDBPDatabase } from 'idb';

import type { CleanupEvent, Write } from '@proton/proton-foundation-search';
import { CleanupEventKind, Document, type WriteEvent } from '@proton/proton-foundation-search';

import type { ESBaseMessage } from '../../models/encryptedSearch.ts';

import { BlobCache } from '../cache/BlobCache';
import type { OpenBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import { EncryptedBlobTransaction } from '../crypto/EncryptedBlobTransaction';
import type { Database, DatabaseStores, ReadWriteTransaction } from '../db/schema';
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

    dispose() {
        this.db.close();
        this.blobCache.free();
    }

    async cleanup(blobTxn: OpenBlobTransaction, signal?: AbortSignal): Promise<void> {
        const cleanup = this.engine.cleanup();
        if (!cleanup) {
            throw new Error("can't cleanup, other operation in progress");
        }
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
    }

    clear<Stores extends DatabaseStores>(txn: ReadWriteTransaction<Stores, 'config' | 'index_blobs'>) {
        //eslint-disable-next-line @typescript-eslint/no-floating-promises -- no need to await delete, txn.done is enough
        txn.objectStore('config').delete('blobs_revision');
        //eslint-disable-next-line @typescript-eslint/no-floating-promises -- no need to await clear, txn.done is enough
        txn.objectStore('index_blobs').clear();
    }

    async writeBatch(messages: Message[], abortSignal?: AbortSignal): Promise<OpenBlobTransaction> {
        abortSignal?.throwIfAborted();
        const writer = this.createWrite();
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
        return this.writerToBlobTxn(writer, abortSignal);
    }

    async deleteByIds(ids: string[], abortSignal?: AbortSignal): Promise<OpenBlobTransaction> {
        abortSignal?.throwIfAborted();
        const writer = this.createWrite();
        try {
            for (const id of ids) {
                writer?.remove(id);
            }
        } catch (err) {
            writer.free();
            throw err;
        }
        return this.writerToBlobTxn(writer, abortSignal);
    }

    private createWrite(): Write {
        const writer = this.engine.write();
        if (!writer) {
            throw new Error('could not write');
        }
        return writer;
    }

    private async writerToBlobTxn(writer: Write, abortSignal?: AbortSignal): Promise<OpenBlobTransaction> {
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
        abortSignal?.throwIfAborted();
        return blobTxn;
    }
}
