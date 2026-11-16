import type { IDBPDatabase } from 'idb';

import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { OpenBlobTransaction } from '../../../crypto/EncryptedBlobTransaction';
import type { Anchor, Database, DatabaseStores, ReadWriteTransaction } from '../../../db/schema';
import type { MessageCache } from '../../MessageCache';
import type { StartBlobTxnFn } from '../BlobTxnProvider';
import type { BodySource } from '../BodySource';
import type { IndexApi } from '../IndexApi';
import type { IndexTask, TaskName, WorkerIndexListener } from '../IndexWorker';
import type { EngineWrapper } from '../wrapper';

export class HistoricIndexer implements IndexTask {
    private stopAtNextIterationFlag = false;
    private runRequested = false;

    constructor(
        private readonly api: IndexApi,
        private readonly bodySource: BodySource,
        private readonly messageCache: MessageCache,
        private readonly listener: WorkerIndexListener,
        private readonly engine: EngineWrapper
    ) {}

    get name(): TaskName {
        return 'historic';
    }

    /** immediateAbortSignal is raised when we lose the database lock,
     *  in which case we should abort immediately to not delay search.
     *  stopAtNextIterationFlag is raised when incremental sync wants to take
     *  priority over historic indexing, in which case we want to allow the
     *  current iteration to finish, less urgent */
    stopAtNextIteration() {
        this.stopAtNextIterationFlag = true;
    }

    requestRun() {
        this.runRequested = true;
    }

    async needsRun(db: IDBPDatabase<Database>) {
        // already went through the whole mailbox (e.g. startup action after a reload)
        if (this.runRequested && (await db.get('anchors', 'historic'))?.eof) {
            this.runRequested = false;
        }
        return this.runRequested;
    }

    async run(db: IDBPDatabase<Database>, startBlobTxn: StartBlobTxnFn, abort: AbortSignal): Promise<void> {
        let emittedInitialStatus = false;
        this.stopAtNextIterationFlag = false;
        while (this.runRequested && !this.stopAtNextIterationFlag) {
            const txn = db.transaction(['anchors', 'config', 'event_cursor'], 'readonly');
            // open the blob txn when we read the anchor, so we detect any changes in the db by the time we commit
            const blobTxn = await startBlobTxn(db, txn);
            abort.throwIfAborted();
            const anchor = await txn.objectStore('anchors').get('historic');
            const eventCursor = await txn.objectStore('event_cursor').get('event_cursor');
            // the previous iteration wrote the last page
            if (anchor?.eof) {
                this.runRequested = false;
                return;
            }

            // The event the backward pass starts from, so catch-up sync can go forwards from there
            // when no incremental update comes in (e.g. the app is closed).
            const startEventId = !anchor && !eventCursor ? await this.api.fetchLatestEventId(abort) : undefined;
            const { messages, nextAnchor, totalMessages } = await this.api.fetchMetadataPage(anchor, abort);
            abort.throwIfAborted();
            const processed = anchor?.position?.processed ?? 0;
            // An eof page is empty (see `calculateNextAnchor`): persist the eof flag and stop, otherwise
            // we would keep fetching the same empty page forever since the anchor position doesn't move.
            if (nextAnchor.eof) {
                await this.writeEOF(nextAnchor, startEventId, db);
                this.listener.reportHistoricProgress(processed, totalMessages);
                this.runRequested = false;
                return;
            }
            // give an initial progress update once we know the total amount of items
            if (!emittedInitialStatus) {
                emittedInitialStatus = true;
                this.listener.reportHistoricProgress(processed, totalMessages);
            }

            abort.throwIfAborted();
            const messageCacheTxn = this.messageCache.startTransaction();
            const decryptedBodies = await this.bodySource.getBodiesForMetadata(messages, messageCacheTxn, abort);
            abort.throwIfAborted();
            await this.writeMessages(messages, decryptedBodies, blobTxn, abort);
            const sealedBlobTxn = await blobTxn.encrypt();
            const sealedMessageCacheTxn = await messageCacheTxn.encrypt(db);
            abort.throwIfAborted();
            const writeTxn = db.transaction(
                ['anchors', 'event_cursor', 'index_blobs', 'config', 'message_cache'],
                'readwrite'
            );
            await sealedBlobTxn.verifyAndWrite(writeTxn);
            sealedMessageCacheTxn.write(writeTxn);
            void writeTxn.objectStore('anchors').put(nextAnchor, 'historic');
            if (startEventId) {
                this.writeCursorStart(writeTxn, startEventId);
            }
            await writeTxn.done;
            // report progress
            this.listener.reportHistoricProgress(nextAnchor.position?.processed ?? 0, totalMessages);
        }
    }

    private async writeEOF(nextAnchor: Anchor, startEventId: string | undefined, db: IDBPDatabase<Database>) {
        const writeTxn = db.transaction(['anchors', 'event_cursor'], 'readwrite');
        void writeTxn.objectStore('anchors').put(nextAnchor, 'historic');
        // in case of an empty mailbox, we'll hit eof before writing anything
        // to the index so we need to also write the cursor start here.
        if (startEventId) {
            this.writeCursorStart(writeTxn, startEventId);
        }
        await writeTxn.done;
    }

    /** write what event id catch-up sync should start from when committing the first historic indexer result */
    private writeCursorStart<Stores extends DatabaseStores>(
        txn: ReadWriteTransaction<Stores, 'event_cursor'>,
        startEventId: string
    ) {
        void txn.objectStore('event_cursor').put({ eventID: startEventId }, 'event_cursor');
    }

    private async writeMessages(
        items: MessageMetadata[],
        decryptedBodies: Map<string, string>,
        blobTxn: OpenBlobTransaction,
        abortSignal: AbortSignal
    ): Promise<void> {
        const write = this.engine.write();
        try {
            for (const message of items.values()) {
                write.insertMessage(message, decryptedBodies.get(message.ID));
            }

            await write.execute(blobTxn, abortSignal);
        } finally {
            write.dispose();
        }
        // TODO: consider doing cleanup in blobTxn.encrypt as that
        // is almost always the point at which you'll want to cleanup
        await this.engine.cleanup(blobTxn, abortSignal);
    }
}
