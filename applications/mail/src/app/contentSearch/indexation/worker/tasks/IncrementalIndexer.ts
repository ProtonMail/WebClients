import type { IDBPDatabase } from 'idb';

import type { ESBaseMessage } from '../../../../models/encryptedSearch';
import type { Database } from '../../../db/schema';
import { isAbortedFrom } from '../../../utils/AsyncAbort';
import type { MessageCache, MessageCacheContent, OpenMessageCacheTransaction } from '../../MessageCache';
import type { StartBlobTxnFn } from '../BlobTxnProvider';
import type { BodySource } from '../BodySource';
import type { IndexTask, TaskName } from '../IndexWorker';
import type { EngineWrapper } from '../wrapper';

export interface EventUpdate {
    eventID: string;
    items: EventUpdateItem[];
}

type InsertUpdate = {
    metadata: ESBaseMessage;
    fetchBodyId?: string;
};
type DeleteUpdate = {
    deleteId: string;
};
export type EventUpdateItem = InsertUpdate | DeleteUpdate;

export class IncrementalIndexer implements IndexTask {
    private queue: EventUpdate[] = [];
    private bodyCache?: Map<string, MessageCacheContent>;

    constructor(
        private readonly bodySource: BodySource,
        private readonly messageCache: MessageCache,
        private readonly engine: EngineWrapper
    ) {}

    get name(): TaskName {
        return 'incremental';
    }

    async run(db: IDBPDatabase<Database>, startBlobTxn: StartBlobTxnFn, abortSignal: AbortSignal) {
        while (this.queue.length !== 0) {
            const next = this.queue[0];
            await this.processUpdate(db, startBlobTxn, next, abortSignal);
            this.queue.shift(); // remove the first element
        }
    }

    pushUpdate(update: EventUpdate) {
        this.queue.push(update);
    }

    hasWork() {
        return this.queue.length !== 0;
    }

    private async processUpdate(
        db: IDBPDatabase<Database>,
        startBlobTxn: StartBlobTxnFn,
        update: EventUpdate,
        abortSignal: AbortSignal
    ) {
        abortSignal.throwIfAborted();
        const messageCacheTxn = this.messageCache.startTransaction();
        const decryptedBodies = await this.downloadAndDecryptBodies(update.items, messageCacheTxn, abortSignal);
        const blobTxn = await startBlobTxn(db);
        const write = this.engine.write();
        try {
            for (const item of update.items) {
                if ('deleteId' in item) {
                    write.remove(item.deleteId);
                    messageCacheTxn.removeMessage(item.deleteId);
                } else if (item.fetchBodyId === undefined) {
                    write.insertMetadata(item.metadata);
                    messageCacheTxn.updateMetadata(item.metadata);
                } else {
                    write.insertMessage(item.metadata, decryptedBodies.get(item.metadata.ID));
                }
            }
            await write.execute(blobTxn, abortSignal);
        } finally {
            write.dispose();
        }
        await this.engine.cleanup(blobTxn, abortSignal);
        const sealedBlobTxn = await blobTxn.encrypt();
        const sealedMessageCacheTxn = await messageCacheTxn.encrypt(db);
        const writeTxn = db.transaction(['event_cursor', 'index_blobs', 'config', 'message_cache'], 'readwrite');
        await sealedBlobTxn.verifyAndWrite(writeTxn);
        sealedMessageCacheTxn.write(writeTxn);
        void writeTxn.objectStore('event_cursor').put({ eventID: update.eventID }, 'event_cursor');
        await writeTxn.done;
        this.bodyCache = undefined;
    }

    private async downloadAndDecryptBodies(
        items: EventUpdateItem[],
        messageCacheTxn: OpenMessageCacheTransaction,
        abortSignal: AbortSignal
    ) {
        const metadataNeedingFetches = (
            items.filter((i) => 'fetchBodyId' in i && i.fetchBodyId !== undefined) as InsertUpdate[]
        ).map((m) => m.metadata);
        // the backend can put up to 250 elements in items and our
        // batch api endpoint to fetch bodies only allows 20 messages at a time,
        // so we use a cache to remember the messages fetched
        // so far in case we get interrupted.
        if (!this.bodyCache) {
            this.bodyCache = new Map();
        }
        try {
            return await this.bodySource.getBodiesForMetadata(
                metadataNeedingFetches,
                messageCacheTxn,
                abortSignal,
                this.bodyCache
            );
        } catch (err) {
            // only if this task is aborted should we keep the cache around for the next run.
            if (!isAbortedFrom(err, abortSignal)) {
                this.bodyCache = undefined;
            }
            throw err;
        }
    }
}
