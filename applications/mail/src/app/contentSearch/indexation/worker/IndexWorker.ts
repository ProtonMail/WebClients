import type * as Comlink from 'comlink';
import type { IDBPDatabase } from 'idb';

import { openContentSearchDB } from '../../db/open';
import type { Database } from '../../db/schema';
import { createMailSearchEngine } from '../../engine/create';
import { isAbortedFrom } from '../../utils/AsyncAbort';
import type { LogLevel } from '../../utils/logger';
import type { MailApiBridge } from '../MailApiBridge';
import { MessageCache } from '../MessageCache';
import { BlobTxnProvider, type StartBlobTxnFn } from './BlobTxnProvider';
import { BodySource } from './BodySource';
import { IndexApi } from './IndexApi';
import { MailDelegate } from './MailDelegate';
import { HistoricIndexer } from './tasks/HistoricIndexer';
import type { EventUpdate } from './tasks/IncrementalIndexer';
import { IncrementalIndexer } from './tasks/IncrementalIndexer';
import { EngineWrapper } from './wrapper';

export type TaskName = 'historic' | 'incremental' | 'catchup';

export interface WorkerIndexListener {
    reportHistoricProgress(processed: number, total: number): void;
    reportIndexComplete(): void;
    reportTaskStarted(taskName: TaskName): void;
    reportTaskCompleted(taskName: TaskName): void;
    reportError: (err: Error) => void;
    log: (level: LogLevel, message: string) => void;
}

export interface IndexTask {
    get name(): TaskName;
    // returns whether it finished or not
    run(db: IDBPDatabase<Database>, startBlobTxn: StartBlobTxnFn, abortSignal: AbortSignal): Promise<void>;
}

/** does the actual indexing, expected to run in worker */
export class IndexWorker {
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
     */
    constructor(
        private readonly userId: string,
        private readonly indexKey: CryptoKey,
        api: Comlink.Remote<MailApiBridge>,
        private readonly listener: WorkerIndexListener
    ) {
        const mailDelegate = new MailDelegate();
        const indexApi = new IndexApi(api);
        const bodySource = new BodySource(indexApi);
        const messageCache = new MessageCache(indexKey);
        const engine = new EngineWrapper(createMailSearchEngine(), mailDelegate);
        this.historicIndexer = new HistoricIndexer(indexApi, bodySource, messageCache, this.listener, engine);
        this.incrementalIndexer = new IncrementalIndexer(bodySource, messageCache, engine);
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

    pushStartupAction() {
        if (this.locked) {
            return false;
        }
        this.historicIndexer.needsRun = true;
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
            while ((task = this.selectTask())) {
                this.listener?.reportTaskStarted(task.name);
                const blobTxnProvider = new BlobTxnProvider(this.indexKey, {
                    shortLivedCache: task.name === 'incremental',
                });
                try {
                    await task.run(db, blobTxnProvider.startTxn.bind(blobTxnProvider), signal);
                } finally {
                    blobTxnProvider.dispose();
                    this.listener?.reportTaskCompleted(task.name);
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

    private selectTask(): IndexTask | undefined {
        if (this.incrementalIndexer.hasWork()) {
            return this.incrementalIndexer;
        } else if (this.historicIndexer.needsRun) {
            return this.historicIndexer;
        }
    }
}
