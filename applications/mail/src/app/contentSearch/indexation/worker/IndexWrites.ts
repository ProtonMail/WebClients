import type { IDBPDatabase } from 'idb';

import type { OpenBlobTransaction } from '../../crypto/EncryptedBlobTransaction';
import type { Database, DatabaseStores, ReadTransaction } from '../../db/schema';
import type { IndexReader } from '../../search/IndexReader';
import { isAbortedFrom } from '../../utils/AsyncAbort';
import { BlobTxnProvider } from './BlobTxnProvider';
import type { WorkerIndexListener } from './IndexWorker';
import type { MatchSource, OpenSearchMatcher, WrittenMessage } from './OpenSearchMatcher';

/**
 * What a task writes the index with, for one run: the blob transactions it writes through, and what it does once a
 * write is committed, telling the open searches of every tab what changed for them.
 *
 * Those belong together, rather than the matcher being handed to the tasks on its own, for three reasons:
 * - The matcher must read through the blob cache the write just warmed. Matching searches the index over the time
 *   span of what was written, which loads mostly the blobs the write itself touched: with the writer's cache, they're
 *   already decrypted in memory, with a cache of its own, each one is read and decrypted again. The cache lives in a
 *   `BlobTxnProvider` created per task run, so the one handing out the write transactions is the only one that can
 *   hand out the read transaction on the same cache. Bundling them makes matching through another cache impossible.
 *   It's also why the incremental indexer's short-lived cache is now kept until the next write rather than freed
 *   before the matcher could use it (see `BlobTxnProvider.startReadTxn`).
 * - Both reports must come after the commit, never before: a search told that a message left or joined its results
 *   may run again, and has to find the index as it was reported. Writers call them once their write transaction is
 *   done.
 * - Matching must never fail a write, which is committed either way: an abort (a search interrupting indexing) keeps
 *   the messages pending in the matcher, to be matched with the next write or before the worker stops
 *   (`matchPending`), and an error is logged. That rule is written once here, rather than in every writer.
 */
export class IndexWrites {
    private readonly blobTxnProvider: BlobTxnProvider;
    private readonly matchSource: MatchSource;

    constructor(
        private readonly db: IDBPDatabase<Database>,
        reader: IndexReader,
        indexKey: CryptoKey,
        options: { shortLivedCache: boolean },
        private readonly matcher: OpenSearchMatcher,
        private readonly listener: Pick<WorkerIndexListener, 'reportDeleted' | 'log'>
    ) {
        this.blobTxnProvider = new BlobTxnProvider(indexKey, options);
        this.matchSource = {
            reader,
            startReadTxn: () => {
                return this.blobTxnProvider.startReadTxn(this.db);
            },
        };
    }

    /** A transaction to write blobs through, see `EncryptedBlobTransaction.start`. */
    startBlobTxn<Stores extends DatabaseStores>(
        idbTxn?: ReadTransaction<Stores, 'config'> | undefined
    ): Promise<OpenBlobTransaction> {
        return this.blobTxnProvider.startTxn(this.db, idbTxn);
    }

    /**
     * Once a write is committed: tells the open searches about the messages it wrote (not the deleted ones), reading
     * through the blob cache `startBlobTxn` warmed. Never throws: if aborted, they're matched on the next call.
     */
    async matchWritten(messages: WrittenMessage[], abortSignal: AbortSignal): Promise<void> {
        try {
            await this.matcher.matchWritten(messages, this.matchSource, abortSignal);
        } catch (err) {
            // an aborted task stops at its next check
            if (!isAbortedFrom(err, abortSignal)) {
                this.listener.log('error', `failed to match written messages against open searches: ${err}`);
            }
        }
    }

    /** Matches what an interrupted matching left, before the worker stops and it's lost. Never throws. */
    async matchPending(abortSignal: AbortSignal): Promise<void> {
        if (this.matcher.hasPending) {
            await this.matchWritten([], abortSignal);
        }
    }

    /** Once a write is committed: the messages it deleted leave every open search, no need to ask the index. */
    reportDeleted(ids: string[]): void {
        if (ids.length !== 0) {
            this.listener.reportDeleted(ids);
        }
    }

    dispose() {
        this.blobTxnProvider.dispose();
    }
}
