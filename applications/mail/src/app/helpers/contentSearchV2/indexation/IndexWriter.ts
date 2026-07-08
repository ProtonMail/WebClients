import type { IDBPDatabase } from 'idb';

import type { CleanupEvent } from '@proton/proton-foundation-search';
import {
    CleanupEventKind,
    Document,
    Engine,
    SerDes,
    type WriteEvent,
    WriteEventKind,
} from '@proton/proton-foundation-search';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage } from 'proton-mail/models/encryptedSearch.ts';

import { EncryptedBlobTransaction } from '../crypto/EncryptedBlobTransaction.ts';
import { KeyManager } from '../crypto/KeyManager.ts';
import { openContentSearchDB } from '../db/open.ts';
import type { Database } from '../db/schema.ts';
import { MailDelegate } from './MailDelegate.ts';

export class IndexWriter {
    private delegate: MailDelegate;
    private engine: Engine;

    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey
    ) {
        this.engine = Engine.builder().build();
        this.delegate = new MailDelegate();
    }

    static async open(userId: string, userKeys: DecryptedKey[]): Promise<IndexWriter> {
        const db = await openContentSearchDB(userId);
        const keyManager = new KeyManager(userKeys, db);
        const key = await keyManager.getKey();
        return new IndexWriter(db, key);
    }

    close() {
        this.db.close();
    }

    async cleanup(signal?: AbortSignal): Promise<void> {
        const cleanup = this.engine.cleanup();
        if (!cleanup) {
            throw new Error("can't cleanup, other operation in progress");
        }
        const blobTxn = await EncryptedBlobTransaction.start(this.db, this.indexKey);
        let event: CleanupEvent | undefined;
        try {
            while ((event = cleanup.next())) {
                signal?.throwIfAborted();
                switch (event.kind()) {
                    case CleanupEventKind.Load:
                        const blob = await blobTxn.readBlob(event.id().toString());
                        if (blob) {
                            event.send(SerDes.Cbor, blob);
                        } else {
                            event.sendEmpty();
                        }
                        break;
                    case CleanupEventKind.Release:
                        blobTxn.deleteBlob(event.id().toString());
                        break;
                    case CleanupEventKind.Save:
                        blobTxn.writeBlob(
                            event.id().toString(),
                            event.recv().serialize(SerDes.Cbor) as Uint8Array<ArrayBuffer>
                        );
                        break;
                    case CleanupEventKind.Tracked:
                        blobTxn.trackBlob(event.id().toString());
                        break;
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

    async writeBatch(messages: { metadata: ESBaseMessage; body: string }[], abortSignal?: AbortSignal) {
        abortSignal?.throwIfAborted();
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
        const blobTxn = await EncryptedBlobTransaction.start(this.db, this.indexKey);
        abortSignal?.throwIfAborted();
        const execution = writer.commit();
        try {
            let event: WriteEvent | undefined;
            while ((event = execution.next())) {
                switch (event.kind()) {
                    case WriteEventKind.Load:
                        const blob = await blobTxn.readBlob(event.id().toString());
                        abortSignal?.throwIfAborted();
                        if (blob) {
                            event.send(SerDes.Cbor, blob);
                        } else {
                            event.sendEmpty();
                        }
                        break;
                    case WriteEventKind.Save:
                        blobTxn.writeBlob(
                            event.id().toString(),
                            event.recv().serialize(SerDes.Cbor) as Uint8Array<ArrayBuffer>
                        );
                        break;
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
}
