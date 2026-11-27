import type { IDBPDatabase } from 'idb';

import type { ESBaseMessage } from '../../../models/encryptedSearch';
import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import type { Database } from '../../db/schema';
import { isAbortedFrom } from '../../utils/AsyncAbort';
import type { MessageCache, MessageCacheContent, OpenMessageCacheTransaction } from '../MessageCache';
import type { BodySource } from './BodySource';
import type { WorkerIndexListener } from './IndexWorker';
import type { IndexWrites } from './IndexWrites';
import type { EngineWrapper, WriteWrapper } from './wrapper';

export interface EventUpdate {
    eventID: string;
    /** empty when the event didn't change any message */
    items: EventUpdateItem[];
    /** the events can't be replayed (cursor expired or unknown), the index must be rebuilt */
    refresh: boolean;
}

type InsertUpdate = {
    metadata: ESBaseMessage;
    fetchBodyId?: string;
};
type DeleteUpdate = {
    deleteId: string;
};
export type EventUpdateItem = InsertUpdate | DeleteUpdate;

/**
 * Applies an event update to the index: fetches the bodies it needs, writes the engine and the message cache,
 * and commits them together with the update's event id as the new event cursor, in one transaction.
 *
 * A `refresh` is the server telling us the index can't be updated incrementally from the event loop anymore.
 * For now, `onRefresh` then drops the index and indexing starts over.
 *
 * Holds a body cache across an aborted `apply`, so retrying the same update doesn't refetch the bodies
 * fetched so far. Give each task its own writer so they don't share that cache.
 */
export class EventUpdateWriter {
    private bodyCache?: Map<string, MessageCacheContent>;

    /** @param onRefresh resets the index, for an update with `refresh` */
    constructor(
        private readonly bodySource: BodySource,
        private readonly messageCache: MessageCache,
        private readonly engine: EngineWrapper,
        private readonly onRefresh: (db: IDBPDatabase<Database>) => Promise<void>,
        private readonly log: WorkerIndexListener['log']
    ) {}

    async apply(db: IDBPDatabase<Database>, writes: IndexWrites, update: EventUpdate, abortSignal: AbortSignal) {
        abortSignal.throwIfAborted();
        if (update.refresh) {
            this.bodyCache = undefined;
            await this.onRefresh(db);
        } else {
            await this.writeUpdate(db, writes, update, abortSignal);
        }
    }

    private async writeUpdate(
        db: IDBPDatabase<Database>,
        writes: IndexWrites,
        update: EventUpdate,
        abortSignal: AbortSignal
    ) {
        let messageCacheTxn: OpenMessageCacheTransaction | undefined;
        let blobTxn: OpenBlobTransaction | undefined;
        // most catch-up pages don't touch messages: the engine and message cache are left alone, only the cursor moves
        if (update.items.length !== 0) {
            messageCacheTxn = this.messageCache.startTransaction();
            const decryptedBodies = await this.downloadAndDecryptBodies(update.items, messageCacheTxn, abortSignal);
            blobTxn = await writes.startBlobTxn();
            const write = this.engine.write();
            try {
                for (const item of update.items) {
                    this.writeItem(item, write, messageCacheTxn, decryptedBodies);
                }
                await write.execute(blobTxn, abortSignal);
            } finally {
                write.dispose();
            }
            await this.engine.cleanup(blobTxn, abortSignal);
        }
        await this.commit(db, blobTxn, messageCacheTxn, update.eventID);
        this.bodyCache = undefined;
        if (update.items.length !== 0) {
            this.logApplied(update.items);
        }
        writes.reportDeleted(
            update.items.flatMap((item) => {
                return 'deleteId' in item ? [item.deleteId] : [];
            })
        );
        await writes.matchWritten(
            update.items.flatMap((item) => {
                return 'metadata' in item ? [item.metadata] : [];
            }),
            abortSignal
        );
    }

    private logApplied(items: EventUpdateItem[]) {
        let deleted = 0;
        let metadataOnly = 0;
        for (const item of items) {
            if ('deleteId' in item) {
                deleted += 1;
            } else if (item.fetchBodyId === undefined) {
                metadataOnly += 1;
            }
        }
        const withBody = items.length - deleted - metadataOnly;
        this.log(
            'info',
            `applied event update with ${items.length} messages: ${withBody} with body, ${metadataOnly} metadata only, ${deleted} deleted`
        );
    }

    /**
     * encrypts the index blobs and message cache entries, if any, and writes them with the new event cursor
     * in one transaction
     */
    private async commit(
        db: IDBPDatabase<Database>,
        blobTxn: OpenBlobTransaction | undefined,
        messageCacheTxn: OpenMessageCacheTransaction | undefined,
        eventID: string
    ) {
        const sealedBlobTxn = await blobTxn?.encrypt();
        const sealedMessageCacheTxn = await messageCacheTxn?.encrypt(db);
        const writeTxn = db.transaction(['event_cursor', 'index_blobs', 'config', 'message_cache'], 'readwrite');
        await sealedBlobTxn?.verifyAndWrite(writeTxn);
        sealedMessageCacheTxn?.write(writeTxn);
        void writeTxn.objectStore('event_cursor').put({ eventID }, 'event_cursor');
        await writeTxn.done;
    }

    /** inserted bodies are queued in the message cache transaction when they're fetched, see `BodySource` */
    private writeItem(
        item: EventUpdateItem,
        write: WriteWrapper,
        messageCacheTxn: OpenMessageCacheTransaction,
        decryptedBodies: Map<string, string>
    ) {
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
