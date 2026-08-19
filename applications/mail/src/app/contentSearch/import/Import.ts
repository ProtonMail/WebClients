import type { IDBPDatabase } from 'idb';

import createListeners from '@proton/shared/lib/helpers/listeners';

import type { ESBaseMessage } from '../../models/encryptedSearch';

import type { Database } from '../db/schema.ts';
import { IndexWriter } from '../indexation/IndexWriter.ts';
import { IndexReader } from '../search/IndexReader.ts';
import type { BatchReader, EncryptedSearchReader } from './EncryptedSearchReader.ts';

export enum ImportIssueSeverity {
    Warning = 'Warning', // item was still imported
    Error = 'Error', // item was not imported
    Fatal = 'Fatal', // importation could not proceed
}

export interface ImportIssue {
    severity: ImportIssueSeverity;
    message: string;
    id: string | undefined;
}

// this is the main tuning knob for the size and amount of blobs
// we end up with in the new index, as the batch is written in one operation.
export const BATCH_SIZE = 50;

export interface ImportNotifications {
    onTotalAvailable(total: number): void;
    onCompleted(completed: number): void;
    onIssue(issue: ImportIssue): void;
}

/** does the actual import, expected to run in worker */
export class Import {
    public readonly onProgress = createListeners<[number]>();
    public readonly onIssue = createListeners<[ImportIssue[]]>();

    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey,
        private srcReader: EncryptedSearchReader,
        private notifications: ImportNotifications,
        private batchSize: number
    ) {}

    private async getMissingDstIds(srcReader: EncryptedSearchReader, dstReader: IndexReader): Promise<string[]> {
        const newIds = new Set(await dstReader.getAllIds());
        const missingIds: string[] = [];
        await srcReader.iterateSortedMessageIds((id) => {
            if (!newIds.has(id)) {
                missingIds.push(id);
            }
        });
        return missingIds;
    }

    private async getOutdatedAndDeletedIds() {
        const deletedIds = [];
        const outdatedIds = [];
        const txn = this.db.transaction('outdated_import_ids');
        for await (const cursor of txn.store) {
            if (cursor.key !== 'refresh' && typeof cursor.value === 'object') {
                if (cursor.value.deleted === true) {
                    deletedIds.push(cursor.key);
                } else {
                    outdatedIds.push(cursor.key);
                }
            }
        }
        return { deletedIds, outdatedIds };
    }

    public async run() {
        await this.applyRefreshIfNeeded();
        const dstReader = new IndexReader(this.db, this.indexKey);
        const missingIds = await this.getMissingDstIds(this.srcReader, dstReader);
        // note: don't close dstReader, it shares this.db (owned by the caller) with the writer below.
        const { deletedIds, outdatedIds } = await this.getOutdatedAndDeletedIds();
        const totalToImport = outdatedIds.length + missingIds.length;
        this.notifications.onTotalAvailable(totalToImport);
        let totalCompleted = 0;
        const onMessageCompleted = (completed: number) => {
            totalCompleted += completed;
            this.notifications.onCompleted(totalCompleted);
        };
        const dstWriter = new IndexWriter(this.db, this.indexKey);
        try {
            await this.deleteMessages(deletedIds, dstWriter);
            const missingSrc = this.srcReader.createBatchReader(missingIds);
            await this.importMessages(missingSrc, dstWriter, onMessageCompleted);
            const outdatedSrc = this.srcReader.createBatchReader(outdatedIds);
            await this.importMessages(outdatedSrc, dstWriter, onMessageCompleted);
        } finally {
            // this closes the db
            dstWriter.dispose();
        }
    }

    private async applyRefreshIfNeeded() {
        if ((await this.db.get('outdated_import_ids', 'refresh')) !== undefined) {
            const txn = this.db.transaction(['config', 'index_blobs', 'outdated_import_ids'], 'readwrite');
            new IndexWriter(this.db, this.indexKey).clear(txn);
            void txn.objectStore('outdated_import_ids').clear();
            await txn.done;
        }
    }

    private async deleteMessages(ids: string[], dstWriter: IndexWriter) {
        const blobTxn = await dstWriter.deleteByIds(ids);
        // cleanup before writing, otherwise index grows enormous
        await dstWriter.cleanup(blobTxn);
        const sealedTxn = await blobTxn.encrypt();
        const txn = this.db.transaction(['config', 'index_blobs'], 'readwrite');
        try {
            await sealedTxn.verifyAndWrite(txn);
        } catch (err) {
            txn.abort();
            throw err;
        }
        // we don't delete the deleted ids from outdated_import_ids btw
        // so we'll try to delete these on every import, which should be fine.
        // we do this so that if a deleted message somehow is still present
        // in the old index, we don't bring it back.
        // e.g. we preserve the delete intent.
        await txn.done;
    }

    private async importMessages(
        src: BatchReader,
        dstWriter: IndexWriter,
        onMessageCompleted: (completed: number) => void
    ) {
        let messages: { metadata: ESBaseMessage; body: string }[] | undefined;
        while ((messages = await src.readNextBatch(this.batchSize, (issue) => this.notifications.onIssue(issue)))) {
            const blobTxn = await dstWriter.writeBatch(messages);
            // cleanup before writing, otherwise index grows enormous
            await dstWriter.cleanup(blobTxn);
            const sealedTxn = await blobTxn.encrypt();
            const txn = this.db.transaction(['config', 'index_blobs', 'outdated_import_ids'], 'readwrite');
            try {
                await sealedTxn.verifyAndWrite(txn);
                const outdatedStore = txn.objectStore('outdated_import_ids');
                for (const m of messages) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    outdatedStore.delete(m.metadata.ID);
                }
            } catch (err) {
                txn.abort();
                throw err;
            }
            await txn.done;
            onMessageCompleted(messages.length);
        }
    }
}
