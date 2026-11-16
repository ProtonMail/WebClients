import type { PrivateKeyReference } from '@protontech/crypto';
import type { AesGcmCryptoKey } from '@protontech/crypto/subtle/aesGcm.js';
import * as Comlink from 'comlink';
import { deleteDB } from 'idb';

import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import { getIndexKey as getIndexKeyV1 } from '@proton/encrypted-search/esHelpers/esBuild';
import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';
import type { ESEvent } from '@proton/encrypted-search/models/interfaces';
import type { GetMessageKeys } from '@proton/mail-message/store/messages/messagesTypes';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';

import type { ESBaseMessage } from '../../models/encryptedSearch';
import { getOrGenerateIndexKey as getOrGenerateIndexKeyV2 } from '../crypto/indexKey';
import { DatabaseLock } from '../db/DatabaseLock';
import { deleteContentSearchDB } from '../db/delete';
import { openContentSearchDB } from '../db/open';
import type { IndexStatus } from '../db/schema';
import { ImportHandle } from '../import/ImportHandle';
import type { MetricService } from '../metrics/MetricService';
import { AsyncAbort, isAbortedFrom } from '../utils/AsyncAbort';
import { AsyncInit } from '../utils/AsyncInit';
import type { LogLevel, Logger } from '../utils/logger';
import { EventUpdateMapper } from './EventUpdateMapper';
import { MailApiBridge } from './MailApiBridge';
import { createBatchBodyDecryptor } from './batchBodyDecryptor';
import type { IndexWorker, TaskName, WorkerIndexListener } from './worker/IndexWorker';
import type { IndexWorkerFactory } from './worker/index.worker';

export interface IndexListener extends Omit<WorkerIndexListener, 'log'> {
    reportStatusUpdate(status: IndexStatus | undefined): void;
}

type WorkerCallback = (worker: Comlink.Remote<IndexWorker>) => Promise<boolean>;

export class IndexService {
    private importHandle?: AsyncInit<ImportHandle | undefined>;
    private indexationPromise?: Promise<void>;
    public readonly dbLock = new DatabaseLock();
    /**
     * The Metric service is intialized once in the `useContentSearch` hook.
     * But the `getSharedIndexService` singleton could be called at different times by different callers.
     * A public setter allows callers to update it after construction.
     */
    public metricService: MetricService | undefined;
    private pauseController?: AbortController;
    private worker?: Comlink.Remote<IndexWorker>;
    private workerQueue: WorkerCallback[] = [];
    /**
     * Until a catch-up ran to its end, a live update first requests one: a catch-up that failed or was stopped
     * is lost with its worker, and the live update would move the cursor past the events it hasn't replayed.
     * Reset when a worker fails, as the live updates it had queued are lost with it, but still past the cursor.
     */
    private catchupCompleted = false;
    private readonly apiBridge: MailApiBridge;
    private status?: IndexStatus;
    private readonly listeners: IndexListener[] = [];
    private readonly eventUpdateMapper: EventUpdateMapper;

    constructor(
        public readonly userId: string,
        api: Api,
        private readonly getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>,
        getMessageKeys: GetMessageKeys,
        private readonly logger: Logger
    ) {
        this.apiBridge = new MailApiBridge(api, createBatchBodyDecryptor(getMessageKeys), logger);
        this.eventUpdateMapper = new EventUpdateMapper(logger);
    }

    public subscribe(listener: IndexListener) {
        this.listeners.push(listener);
        return () => {
            const idx = this.listeners.indexOf(listener);
            if (idx !== -1) {
                this.listeners.splice(idx, 1);
            }
        };
    }

    /** should only be called after initialize is called? */
    async handleEvent(event: ESEvent<ESBaseMessage> | undefined) {
        if (this.status !== 'enabled') {
            return;
        }
        const batchUpdate = this.eventUpdateMapper.map(event);
        // an update without items would interrupt historic indexing only to move the cursor,
        // but a refresh must reach the worker, or a later update would move the cursor past it
        if (!batchUpdate || (batchUpdate.items.length === 0 && !batchUpdate.refresh)) {
            return;
        }
        this.runWithWorker(async (worker) => {
            // ensure catchup has ran before running incremental, or we miss events
            if (!this.catchupCompleted) {
                if (!(await worker.pushCatchup())) {
                    return false;
                }
            }
            return worker.pushIncrementalUpdate(batchUpdate);
        });
    }

    /**
     * Fire and forget: never throws, a callback that fails is logged.
     * You should not await long running tasks inside the callback, just enqueue work with the pushXXX methods!
     */
    private runWithWorker(callback: WorkerCallback): void {
        if (this.worker) {
            this.pushToRunningWorker(this.worker, callback).catch((err) => {
                this.logger.error('index worker failed to accept work', err);
            });
        } else {
            this.enqueueForNextWorker(callback);
        }
    }

    private async pushToRunningWorker(worker: Comlink.Remote<IndexWorker>, callback: WorkerCallback) {
        const didWorkerAcceptWork = await callback(worker);
        // if the worker is already locked, it refuses the work and we should enqueue after all and start it again
        if (!didWorkerAcceptWork) {
            this.enqueueForNextWorker(callback);
        }
    }

    /** the worker is not yet usable, and possibly not even running yet: store the callback for when it becomes usable */
    private enqueueForNextWorker(callback: WorkerCallback) {
        this.workerQueue.push(callback);
        this.startWorker();
    }

    /**
     * Record what an event touched, so a later import knows what to refresh.
     * Returns whether it recorded anything: the mail event loop ticks every 30s or so and most of
     * those events carry no message changes, which is not worth an import (each one spawns a worker
     * and rescans both indexes to discover it has nothing to do).
     */
    async recordOutdatedMessages(event: ESEvent<ESBaseMessage>): Promise<boolean> {
        if (!event.Items?.length && !event.Refresh) {
            return false;
        }
        const db = await openContentSearchDB(this.userId);
        try {
            const txn = db.transaction('outdated_import_ids', 'readwrite');
            const outdatedStore = txn.objectStore('outdated_import_ids');
            if (event.Items) {
                for (const i of event.Items) {
                    void outdatedStore.put({ deleted: i.Action === ES_SYNC_ACTIONS.DELETE }, i.ID);
                }
            }
            if (event.Refresh) {
                void outdatedStore.put('', 'refresh');
            }
            await txn.done;
        } finally {
            db.close();
        }
        return true;
    }

    private async readStatus(): Promise<{ status: IndexStatus; historicalFinished: boolean } | undefined> {
        const db = await openContentSearchDB(this.userId);
        try {
            const txn = db.transaction(['config', 'anchors'], 'readonly');
            const status = (await txn.objectStore('config').get('status')) as IndexStatus | undefined;
            const anchor = await txn.objectStore('anchors').get('historic');
            if (status) {
                return { status, historicalFinished: anchor?.eof === true };
            }
        } finally {
            db.close();
        }
    }

    private async writeStatus(newStatus: IndexStatus): Promise<boolean> {
        // immediately update the status in memory with a rollback on failure
        // so any checks on that status don't race
        const prevStatus = this.status;
        this.status = newStatus;
        let db;
        try {
            db = await openContentSearchDB(this.userId);
            const txn = db.transaction('config', 'readwrite');
            const status = await txn.store.get('status');
            if (status !== newStatus) {
                void txn.store.put(newStatus, 'status');
                await txn.done;
                this.listeners.forEach((l) => l.reportStatusUpdate(newStatus));
                return true;
            }
            return false;
        } catch (err) {
            this.status = prevStatus;
            throw err;
        } finally {
            db?.close();
        }
    }

    async pause() {
        if (this.status === 'enabled') {
            await this.writeStatus('paused');
            this.pauseController?.abort();
        }
    }

    /** emits reportStatusUpdate and reportIndexComplete if the index is usable as is */
    public async initialize() {
        const statusAndHistoricalFinished = await this.readStatus();
        this.listeners.forEach((l) => l.reportStatusUpdate(statusAndHistoricalFinished?.status));
        if (!statusAndHistoricalFinished) {
            return;
        }
        const { status, historicalFinished } = statusAndHistoricalFinished;
        this.status = status;
        if (status === 'enabled') {
            // Catch-up runs even in a finished index, for what changed while the app was closed or indexing paused.
            // It doesn't change readiness: search waits for the historic pass only, as v1 doesn't wait for catch-up.
            this.runWithWorker((worker) => worker.pushStartupAction());
            if (historicalFinished) {
                this.listeners.forEach((l) => l.reportIndexComplete());
            }
        }
    }

    async enable() {
        if (this.status !== 'enabled') {
            await this.writeStatus('enabled');
            await this.initialize();
        }
    }

    get isEnabled() {
        return this.status === 'enabled';
    }

    /**
     * Whether the historic pass went through the whole mailbox, read from the `historic` anchor.
     */
    async isHistoricalFinished(): Promise<boolean> {
        const db = await openContentSearchDB(this.userId);
        try {
            const anchor = await db.get('anchors', 'historic');
            return anchor?.eof === true;
        } finally {
            db.close();
        }
    }

    async disable() {
        if (this.status !== undefined && this.status !== 'disabled') {
            await this.writeStatus('disabled');
            this.pauseController?.abort();
        }
    }

    private startWorker() {
        if (!this.indexationPromise) {
            this.indexationPromise = this.runWorker()
                .catch((err) => {
                    this.logger.error('index worker stopped because of error', err);
                    this.catchupCompleted = false;
                    this.listeners.forEach((l) => l.reportError(err));
                })
                .finally(() => {
                    this.indexationPromise = undefined;
                });
        }
    }

    private async runWorker(): Promise<void> {
        // keep running the worker until there is no more work
        // just in case there was more work enqueued between
        // the worker locking itself after completion and the end of this method
        while (this.workerQueue.length !== 0) {
            const pauseController = new AbortController();
            this.pauseController = pauseController;
            try {
                const rawWorker = new Worker(new URL('./worker/index.worker.ts', import.meta.url));
                try {
                    this.logger.info('starting index worker');
                    const indexWorkerFactory = Comlink.wrap<IndexWorkerFactory>(rawWorker);
                    // TODO: deal with cancellation here as well?
                    const worker = await this.createWorkerInstance(indexWorkerFactory);
                    // push any enqueued tasks to the worker
                    let callback: WorkerCallback | undefined;
                    while ((callback = this.workerQueue.shift())) {
                        // this just awaits the comlink confirmation, not the whole task
                        if ((await callback(worker)) === false) {
                            // this should never happen, if it does it's a bug and the index will be stale
                            this.logger.error('fresh worker reports being locked');
                        }
                    }
                    this.worker = worker;
                    await this.dbLock.runIndexing(async (interruptedSignal) => {
                        const startPromise = worker.start();
                        const cancellation = new AsyncAbort([interruptedSignal, pauseController.signal]);
                        try {
                            await Promise.race([startPromise, cancellation.promise]);
                        } finally {
                            cancellation.dispose();
                            await worker.stop();
                        }
                    });
                } finally {
                    this.logger.info('stopping index worker');
                    this.worker = undefined;
                    rawWorker.terminate();
                }
            } catch (err) {
                // paused or disabled by the user, not an error
                if (!isAbortedFrom(err, pauseController.signal)) {
                    throw err;
                }
            } finally {
                this.pauseController = undefined;
            }
        }
    }

    private async createWorkerInstance(
        indexWorkerFactory: Comlink.Remote<IndexWorkerFactory>
    ): Promise<Comlink.Remote<IndexWorker>> {
        const userKeys = await this.getUserKeys();
        const indexKey = await this.getKeyAndDropIndexIfNeeded(userKeys);

        return indexWorkerFactory(
            this.userId,
            indexKey,
            Comlink.proxy(this.apiBridge),
            Comlink.proxy<WorkerIndexListener>({
                reportHistoricProgress: (processed: number, total: number) => {
                    this.listeners.forEach((l) => l.reportHistoricProgress(processed, total));
                },
                reportError: (err) => {
                    this.listeners.forEach((l) => l.reportError(err));
                },
                reportIndexComplete: () => {
                    this.listeners.forEach((l) => l.reportIndexComplete());
                },
                reportTaskStarted: (taskName: TaskName) => {
                    this.listeners.forEach((l) => l.reportTaskStarted(taskName));
                },
                reportTaskCompleted: (taskName: TaskName, success: boolean) => {
                    if (taskName === 'catchup' && success) {
                        this.catchupCompleted = true;
                    }
                    this.listeners.forEach((l) => l.reportTaskCompleted(taskName, success));
                },
                log: (level: LogLevel, message: string) => {
                    this.logger[level](message);
                },
            })
        );
    }

    /**
     * @param isFreshIndex Reports `mailbox_index_completed` when set and `metricService` is available
     * — only appropriate for the first full historic pass, never a refresh, limit extension, or a
     * debug-triggered manual reindex (see `useImporter`, which always leaves this `false`).
     */
    async importFromEncryptedSearch(isFreshIndex = false): Promise<ImportHandle | undefined> {
        if (!this.importHandle || this.importHandle.failed) {
            this.importHandle = new AsyncInit(async () => {
                // The v1 ES DB is the import source. Bail out before touching any v1 read helper
                // when it doesn't exist: those helpers go through openESDB, which *creates* the DB
                // if absent, leaving an empty shell. That shell makes hasESDB report true, so a
                // later enableEncryptedSearch takes the resume branch and fails instead of building
                // a fresh, initialized DB. No v1 DB means there is nothing to import anyway.
                if (!(await hasESDB(this.userId))) {
                    this.importHandle = undefined;
                    return;
                }
                const userKeys = await this.getUserKeys();
                const newIndexKey = await this.getKeyAndDropIndexIfNeeded(userKeys);
                const oldIndexKey = await getIndexKeyV1(userKeys, this.userId);
                if (!oldIndexKey) {
                    this.importHandle = undefined;
                    return;
                }

                if (isFreshIndex) {
                    this.metricService?.startIndexing();
                }

                const keys = {
                    indexV1Key: oldIndexKey,
                    indexV2Key: newIndexKey,
                };
                const importHandle = new ImportHandle(this.userId, keys, this.dbLock, this.logger);

                // errors are handled inside start
                void importHandle.start().finally(() => {
                    this.importHandle = undefined;
                });

                importHandle.done
                    .then((outcome) => {
                        if (isFreshIndex && outcome === 'completed') {
                            this.metricService?.mailboxIndexCompleted({
                                status: 'success',
                                totalMessagesIndexed: importHandle.completed,
                            });
                        }
                    })
                    .catch((err) => {
                        this.logger.error('failed to report import outcome', err);
                    });
                return importHandle;
            });
        }
        return this.importHandle.promise;
    }

    private async getKeyAndDropIndexIfNeeded(userKeys: DecryptedKey<PrivateKeyReference>[]): Promise<AesGcmCryptoKey> {
        {
            const db = await openContentSearchDB(this.userId);
            const dbName = db.name;
            let failedToDecrypt = false;
            try {
                return await getOrGenerateIndexKeyV2(db, userKeys);
            } catch (err) {
                failedToDecrypt = true;
            } finally {
                db.close();
            }
            if (failedToDecrypt) {
                await deleteDB(dbName, {
                    blocked() {
                        throw new Error(
                            "content search: failed to drop index after key couldn't be decrypted: blocked"
                        );
                    },
                });
            }
        }
        {
            const db = await openContentSearchDB(this.userId);
            try {
                return await getOrGenerateIndexKeyV2(db, userKeys);
            } finally {
                db.close();
            }
        }
    }

    get currentImport(): ImportHandle | undefined {
        return this.importHandle?.value;
    }

    async deleteIndex(): Promise<void> {
        // Cancel any running import to avoid blocked connections
        this.importHandle?.value?.stop();
        this.workerQueue = [];
        this.pauseController?.abort();
        await this.indexationPromise;

        await deleteContentSearchDB(this.userId);
        // The in-memory status mirrors the DB we just deleted. Keeping it would make `enable()` believe
        // it's already enabled and skip writing the status and starting the worker.
        this.status = undefined;
    }
}

let sharedIndexService: IndexService | undefined;
export function getSharedIndexService(
    userId: string,
    api: Api,
    getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>,
    getMessageKeys: GetMessageKeys,
    logger: Logger
) {
    if (!sharedIndexService) {
        sharedIndexService = new IndexService(userId, api, getUserKeys, getMessageKeys, logger);
    }
    return sharedIndexService;
}
/**
 * Gets the sharedIndexService for the given user, if it exists.
 */
export function getExistingIndexService(userId: string): IndexService | undefined {
    return sharedIndexService?.userId === userId ? sharedIndexService : undefined;
}
