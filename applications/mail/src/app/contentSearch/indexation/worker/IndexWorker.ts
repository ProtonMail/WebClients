import type * as Comlink from 'comlink';
import type { IDBPDatabase } from 'idb';

import { openContentSearchDB } from '../../db/open';
import type { Database } from '../../db/schema';
import { createMailSearchEngine } from '../../engine/create';
import { isAbortedFrom } from '../../utils/AsyncAbort';
import type { ExponentialBackoff } from '../../utils/ExponentialBackoff';
import type { LogLevel } from '../../utils/logger';
import type { MailApiBridge } from '../MailApiBridge';
import { MessageCache } from '../MessageCache';
import { BlobTxnProvider, type StartBlobTxnFn } from './BlobTxnProvider';
import { BodySource } from './BodySource';
import { type EventUpdate, EventUpdateWriter } from './EventUpdateWriter';
import { IndexApi } from './IndexApi';
import { MailDelegate } from './MailDelegate';
import { CatchupIndexer } from './tasks/CatchupIndexer';
import { HistoricIndexer } from './tasks/HistoricIndexer';
import { IncrementalIndexer } from './tasks/IncrementalIndexer';
import { EngineWrapper } from './wrapper';

export type TaskName = 'historic' | 'incremental' | 'catchup';

export interface WorkerIndexListener {
    reportHistoricProgress(processed: number, total: number): void;
    reportIndexComplete(): void;
    reportTaskStarted(taskName: TaskName): void;
    /**
     * Called whenever a task stops: `success` is false when it failed or was stopped (paused, interrupted by search),
     * so it didn't finish what it was asked to do.
     */
    reportTaskCompleted(taskName: TaskName, success: boolean): void;
    reportError: (err: Error) => void;
    log: (level: LogLevel, message: string) => void;
}

export interface IndexTask {
    get name(): TaskName;
    /**
     * Whether the task has anything to do, checked before it's selected and reported as started,
     * so a task with nothing to do doesn't show up as running (e.g. historic indexing on startup once it reached eof).
     */
    needsRun(db: IDBPDatabase<Database>): Promise<boolean>;
    // returns whether it finished or not
    run(db: IDBPDatabase<Database>, startBlobTxn: StartBlobTxnFn, abortSignal: AbortSignal): Promise<void>;
}

/** does the actual indexing, expected to run in worker */
export class IndexWorker {
    private readonly catchupIndexer: CatchupIndexer;
    private readonly historicIndexer: HistoricIndexer;
    private readonly incrementalIndexer: IncrementalIndexer;
    private stopController?: AbortController;
    private runPromise?: Promise<void>;
    // helps to prevent a specific race: if the worker has run to completion,
    // but the word hasn't reached the main thread yet,
    // more work could be enqueued without calling worker.start again
    private locked = false;
    /**
     * @param api proxy to the main thread's api instance, see {@link MailApiBridge}. Every call is a
     * postMessage round trip, so fetch in pages rather than per message.
     * @param catchupBackoff how catch-up waits before retrying a lagging server, replaced in tests
     */
    constructor(
        private readonly userId: string,
        private readonly indexKey: CryptoKey,
        api: Comlink.Remote<MailApiBridge>,
        private readonly listener: WorkerIndexListener,
        catchupBackoff?: ExponentialBackoff
    ) {
        const mailDelegate = new MailDelegate();
        const indexApi = new IndexApi(api);
        const bodySource = new BodySource(indexApi);
        const messageCache = new MessageCache(indexKey);
        const engine = new EngineWrapper(createMailSearchEngine(), mailDelegate);
        const resetIndex = (db: IDBPDatabase<Database>) => {
            return this.resetIndex(db);
        };
        const log: WorkerIndexListener['log'] = (level, message) => {
            this.listener.log(level, message);
        };
        this.historicIndexer = new HistoricIndexer(indexApi, bodySource, messageCache, this.listener, engine);
        this.catchupIndexer = new CatchupIndexer(
            indexApi,
            new EventUpdateWriter(bodySource, messageCache, engine, resetIndex, log),
            catchupBackoff
        );
        this.incrementalIndexer = new IncrementalIndexer(
            new EventUpdateWriter(bodySource, messageCache, engine, resetIndex, log)
        );
    }

    pushIncrementalUpdate(update: EventUpdate) {
        if (this.locked) {
            return false;
        }
        this.incrementalIndexer.pushUpdate(update);
        // incremental indexing preempts historical, does nothing if not running.
        this.historicIndexer.stopAtNextIteration();
        return true;
    }

    /**
     * Queues what to run or check after starting the app or enabling the index: each task finds out by itself
     * whether there's anything to do (no cursor to catch up from, historic pass already at eof).
     */
    pushStartupAction() {
        if (this.locked) {
            return false;
        }
        this.catchupIndexer.requestRun();
        this.historicIndexer.requestRun();
        return true;
    }

    /** Replays the events since the cursor before applying live updates, for a worker not started by the startup action. */
    pushCatchup() {
        if (this.locked) {
            return false;
        }
        this.catchupIndexer.requestRun();
        return true;
    }

    async start() {
        this.stopController = new AbortController();
        this.runPromise = this.runTasksUntilFinished(this.stopController.signal);
        await this.runPromise;
    }

    async stop() {
        this.stopController?.abort();
        this.stopController = undefined;
        try {
            // wait until the abort signal is picked up and thrown
            await this.runPromise;
        } catch (err) {
            // swallow errors here, they are already reported by start()
        }
    }

    private async runTasksUntilFinished(signal: AbortSignal) {
        const db = await openContentSearchDB(this.userId);
        try {
            let task: IndexTask | undefined;
            while ((task = await this.selectTask(db))) {
                this.listener?.reportTaskStarted(task.name);
                const blobTxnProvider = new BlobTxnProvider(this.indexKey, {
                    shortLivedCache: task.name === 'incremental',
                });
                let success = false;
                try {
                    await task.run(db, blobTxnProvider.startTxn.bind(blobTxnProvider), signal);
                    success = true;
                } finally {
                    blobTxnProvider.dispose();
                    this.listener?.reportTaskCompleted(task.name, success);
                }
            }
            this.listener?.reportIndexComplete();
            // stop accepting more work, this worker is shutting down now
            this.locked = true;
        } catch (err) {
            // we should swallow the abort error but nothing else
            if (!isAbortedFrom(err, signal)) {
                throw err;
            }
        } finally {
            db.close();
        }
    }

    /**
     * Clears everything derived from the mailbox, keeping the index key and status, and has historic indexing
     * rebuild it. Without anchor and cursor, it starts over and stores the latest event as the new cursor.
     * The blob revision goes back to 0, like a new index: no blob transaction can span the reset, as tasks run
     * one at a time and search only reads while holding the database lock.
     */
    private async resetIndex(db: IDBPDatabase<Database>) {
        const txn = db.transaction(['index_blobs', 'message_cache', 'anchors', 'event_cursor', 'config'], 'readwrite');
        void txn.objectStore('config').delete('blobs_revision');
        void txn.objectStore('index_blobs').clear();
        void txn.objectStore('message_cache').clear();
        void txn.objectStore('anchors').clear();
        void txn.objectStore('event_cursor').clear();
        await txn.done;
        this.historicIndexer.requestRun();
    }

    /**
     * Catch-up goes before incremental: a live update stores its own event id as the cursor,
     * so catch-up would start from there and skip the events in between.
     */
    private async selectTask(db: IDBPDatabase<Database>): Promise<IndexTask | undefined> {
        const tasksByPriority: IndexTask[] = [this.catchupIndexer, this.incrementalIndexer, this.historicIndexer];
        for (const task of tasksByPriority) {
            if (await task.needsRun(db)) {
                return task;
            }
        }
        return undefined;
    }
}
