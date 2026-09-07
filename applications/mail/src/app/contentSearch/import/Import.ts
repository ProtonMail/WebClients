import type { IDBPDatabase } from 'idb';

import createListeners from '@proton/shared/lib/helpers/listeners';
import { getItem } from '@proton/shared/lib/helpers/storage';

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

// Read on the main thread before spawning the import worker.
export const DEBUG_CS_IMPORT_BATCH_SIZE_KEY = 'DEBUG_CS_IMPORT_BATCH_SIZE';
export const DEBUG_CS_IMPORT_BATCH_DELAY_MS_KEY = 'DEBUG_CS_IMPORT_BATCH_DELAY_MS';
export const MAX_DEBUG_IMPORT_BATCH_DELAY_MS = 5_000;

const clampImportBatchSize = (size: number): number => Math.min(BATCH_SIZE, Math.max(1, Math.trunc(size)));

const clampImportBatchDelayMs = (delayMs: number): number =>
    Math.min(MAX_DEBUG_IMPORT_BATCH_DELAY_MS, Math.max(0, Math.trunc(delayMs)));

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Resolves how many messages each V2 import batch writes. Production uses {@link BATCH_SIZE}.
 * For debugging, set {@link DEBUG_CS_IMPORT_BATCH_SIZE_KEY} in localStorage before import
 * starts — e.g. from the browser console or Playwright `context.addInitScript`. Changing it
 * mid-import has no effect.
 */
export const resolveImportBatchSize = (): number => {
    const stored = getItem(DEBUG_CS_IMPORT_BATCH_SIZE_KEY);
    if (stored != null) {
        const parsed = Number.parseInt(stored, 10);
        if (Number.isFinite(parsed)) {
            return clampImportBatchSize(parsed);
        }
    }
    return BATCH_SIZE;
};

/**
 * Optional pause between V2 import batch writes (debug / E2E only). Set
 * {@link DEBUG_CS_IMPORT_BATCH_DELAY_MS_KEY} in localStorage before import starts; defaults to 0.
 */
export const resolveImportBatchDelayMs = (): number => {
    const stored = getItem(DEBUG_CS_IMPORT_BATCH_DELAY_MS_KEY);
    if (stored != null) {
        const parsed = Number.parseInt(stored, 10);
        if (Number.isFinite(parsed)) {
            return clampImportBatchDelayMs(parsed);
        }
    }
    return 0;
};

export interface ImportNotifications {
    onTotalAvailable(total: number): void;
    onCompleted(completed: number): void;
    onIssue(issue: ImportIssue): void;
}

/** does the actual import, expected to run in worker */
export class Import {
    public readonly onProgress = createListeners<[number]>();
    public readonly onIssue = createListeners<[ImportIssue[]]>();

    /**
     * Ids this run tried and failed to write. Kept in memory only, for the lifetime of the run: they
     * stay outstanding in the index, so the next import (a refresh, or the one at startup) picks them
     * up again — a failure that turns out to be transient still gets retried, just not in a tight loop.
     */
    private readonly skippedIds = new Set<string>();

    constructor(
        private db: IDBPDatabase<Database>,
        private indexKey: CryptoKey,
        private srcReader: EncryptedSearchReader,
        private notifications: ImportNotifications,
        private batchSize: number,
        private batchDelayMs: number = 0
    ) {}

    /** ids that are missing from the initial import */
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

    /** ids that have been marked as outdated by the event loop */
    private async getOutdatedIds() {
        const deleted = [];
        const updated = [];
        const txn = this.db.transaction('outdated_import_ids');
        for await (const cursor of txn.store) {
            if (cursor.key !== 'refresh' && typeof cursor.value === 'object') {
                if (cursor.value.deleted === true) {
                    deleted.push(cursor.key);
                } else {
                    updated.push(cursor.key);
                }
            }
        }
        return { deleted, updated };
    }

    /** merges getOutdatedIds and getMissingDstIds, minus what this run already gave up on */
    private async getIdsToProcess(dstReader: IndexReader) {
        const outdated = await this.getOutdatedIds();
        const missing = await this.getMissingDstIds(this.srcReader, dstReader);
        const mergedSet = new Set(outdated.updated.concat(missing));
        // A message that can't be imported (its content fails to decrypt, its metadata has no sender)
        // is never written, so it comes back as missing on the next pass and the loop below would
        // never run out of work. Excluding what this run already failed on lets the run finish; the
        // ids stay outstanding, so the next import retries them.
        const inserted = Array.from(mergedSet).filter((id) => !this.skippedIds.has(id));
        if (outdated.deleted.length === 0 && inserted.length === 0) {
            // return undefined when there is no work, so the while loop in `run` exits
            return;
        }
        return {
            deleted: outdated.deleted,
            inserted,
        };
    }

    public async run() {
        await this.applyRefreshIfNeeded();
        const dstReader = new IndexReader(this.db, this.indexKey);
        const dstWriter = new IndexWriter(this.db, this.indexKey);
        let idsToProcess: Awaited<ReturnType<Import['getIdsToProcess']>>;
        try {
            while ((idsToProcess = await this.getIdsToProcess(dstReader))) {
                this.notifications.onTotalAvailable(idsToProcess.inserted.length);
                let totalCompleted = 0;
                const onMessageCompleted = (completed: number) => {
                    totalCompleted += completed;
                    this.notifications.onCompleted(totalCompleted);
                };
                await this.deleteMessages(idsToProcess.deleted, dstWriter);
                const srcBatchReader = this.srcReader.createBatchReader(idsToProcess.inserted);
                const importedIds = await this.importMessages(srcBatchReader, dstWriter, onMessageCompleted);
                for (const id of idsToProcess.inserted) {
                    if (!importedIds.has(id)) {
                        this.skippedIds.add(id);
                    }
                }
            }
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
        const txn = this.db.transaction(['config', 'index_blobs', 'outdated_import_ids'], 'readwrite');
        const outdatedStore = txn.objectStore('outdated_import_ids');
        try {
            await sealedTxn.verifyAndWrite(txn);
            for (const id of ids) {
                void outdatedStore.delete(id);
            }
        } catch (err) {
            txn.abort();
            throw err;
        }
        await txn.done;
    }

    /** @returns the ids actually written, so the caller can tell which ones were skipped */
    private async importMessages(
        src: BatchReader,
        dstWriter: IndexWriter,
        onMessageCompleted: (completed: number) => void
    ): Promise<Set<string>> {
        const importedIds = new Set<string>();
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
                    void outdatedStore.delete(m.metadata.ID);
                }
            } catch (err) {
                txn.abort();
                throw err;
            }
            await txn.done;
            for (const m of messages) {
                importedIds.add(m.metadata.ID);
            }
            onMessageCompleted(messages.length);
            if (this.batchDelayMs > 0) {
                await sleep(this.batchDelayMs);
            }
        }
        return importedIds;
    }
}
