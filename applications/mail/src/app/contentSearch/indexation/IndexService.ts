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
import noop from '@proton/utils/noop';

import type { ESBaseMessage } from '../../models/encryptedSearch';
import { LeaderElection } from '../coordination/LeaderElection';
import { TabChannel, type TabMessage } from '../coordination/TabChannel';
import { type TabCoordination, createTabCoordination } from '../coordination/createTabCoordination';
import { getOrGenerateIndexKey as getOrGenerateIndexKeyV2 } from '../crypto/indexKey';
import type { DatabaseLock } from '../db/DatabaseLock';
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
import { dropImportedIndex, dropIndexationIndex } from './switchIndexPath';
import type { IndexWorker, TaskName, WorkerIndexListener } from './worker/IndexWorker';
import type { IndexWorkerFactory } from './worker/index.worker';

export interface IndexListener extends Omit<WorkerIndexListener, 'log'> {
    reportStatusUpdate(status: IndexStatus | undefined): void;
}

type WorkerCallback = (worker: Comlink.Remote<IndexWorker>) => Promise<boolean>;

export class IndexService {
    private importHandle?: AsyncInit<ImportHandle | undefined>;
    /** Promise to drop the database when `ContentSearchIndexation` switches. */
    private dbReset: Promise<void> = Promise.resolve();
    private indexationPromise?: Promise<void>;
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
    /** whether the app initialized the service, which it only does when this tab may index */
    private initialized = false;
    private readonly eventUpdateMapper: EventUpdateMapper;
    /** shared with the other tabs, so a search in any tab interrupts indexing */
    public readonly dbLock: DatabaseLock;
    private readonly channel: TabChannel;
    /** only the leader runs the index worker */
    private readonly election: LeaderElection;

    constructor(
        public readonly userId: string,
        api: Api,
        private readonly getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>,
        getMessageKeys: GetMessageKeys,
        private readonly logger: Logger,
        /** what this tab shares the index with the other tabs of the user with */
        { leaderLock, dbLock, transport }: TabCoordination,
        appVersion: string
    ) {
        this.dbLock = dbLock;
        this.channel = new TabChannel(transport);
        this.election = new LeaderElection(leaderLock, this.channel, appVersion, logger);
        this.apiBridge = new MailApiBridge(api, createBatchBodyDecryptor(getMessageKeys), logger);
        this.eventUpdateMapper = new EventUpdateMapper(logger);
        this.channel.subscribe((message) => {
            this.handleTabMessage(message);
        });
        this.election.onLeadershipChanged((isLeader) => {
            if (isLeader) {
                this.startLeading().catch((err) => {
                    this.logger.error('failed to start indexing as the new leader', err);
                });
            } else {
                this.stopLeading();
            }
        });
    }

    /** stops the worker the way pausing does: the next leader runs its own startup */
    private stopLeading() {
        if (this.indexationPromise || this.workerQueue.length) {
            this.logger.info('stopping indexing, as this tab no longer leads');
        }
        this.workerQueue = [];
        this.catchupCompleted = false;
        this.pauseController?.abort();
    }

    /** what the other tabs tell this one */
    private handleTabMessage(message: TabMessage) {
        switch (message.type) {
            case 'status':
                this.applyStatusFromOtherTab(message.status).catch((err) => {
                    this.logger.error('failed to apply the status set in another tab', err);
                });
                break;
            case 'progress':
                // the leader reports its own progress
                if (!this.election.isLeader) {
                    this.listeners.forEach((l) => {
                        l.reportHistoricProgress(message.processed, message.total);
                    });
                }
                break;
            case 'indexComplete':
                if (!this.election.isLeader) {
                    this.logger.info('the leader reports the index complete');
                    this.listeners.forEach((l) => {
                        l.reportIndexComplete();
                    });
                }
                break;
        }
    }

    /** another tab wrote the status before posting it */
    private async applyStatusFromOtherTab(status: IndexStatus | undefined) {
        this.logger.info(`another tab set the index ${status ?? 'deleted'}`);
        if (status === 'enabled') {
            // Reads it back with whether the index is complete, and has the leader start its worker. Only in a tab
            // that initialized its index service: initializing joins the election, which a tab on the import path,
            // or answering searches with v1, must stay out of.
            if (this.initialized) {
                await this.initialize();
            }
            return;
        }
        this.status = status;
        this.listeners.forEach((l) => {
            l.reportStatusUpdate(status);
        });
        this.workerQueue = [];
        this.pauseController?.abort();
    }

    /** the leader startup: a tab only takes part in the election once `initialize()` read the status */
    private async startLeading() {
        await this.dbReset;
        // the previous leader may have changed it since this tab read it
        const statusAndHistoricalFinished = await this.readStatus();
        this.status = statusAndHistoricalFinished?.status;
        if (this.status === 'enabled') {
            this.logger.info('starting to index as the leader');
            this.runWithWorker((worker) => {
                return worker.pushStartupAction();
            });
        }
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
        // the leader indexes what the events change, in every tab
        if (this.status !== 'enabled' || !this.election.isLeader) {
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

    /** Takes the service down for good: stops indexing and the import, and leaves the other tabs to it. */
    dispose() {
        this.logger.info('disposing the index service');
        this.importHandle?.value?.stop();
        this.workerQueue = [];
        this.pauseController?.abort();
        this.election.stop();
        this.channel.close();
    }

    /**
     * Fire and forget: never throws, a callback that fails is logged.
     * You should not await long running tasks inside the callback, just enqueue work with the pushXXX methods!
     */
    private runWithWorker(callback: WorkerCallback): void {
        // only the leader runs a worker, and it runs its own startup when it takes over
        if (!this.election.isLeader) {
            return;
        }
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
     * Neither the import path nor the indexation path can use the database the other one built: call once per
     * session, when the path is settled, before anything opens the database. On the indexation path, an imported
     * index is replaced with an empty enabled one when v1 search is enabled, so it gets rebuilt from scratch.
     * Temporary, until the import path goes: a failed reset fails everything waiting on it until the next load.
     */
    resetDbBetweenFeatureFlagSwitches(isIndexationPath: boolean) {
        this.dbReset = isIndexationPath
            ? dropImportedIndex(this.userId, this.logger)
            : dropIndexationIndex(this.userId, this.logger, () => {
                  // a tab still on the indexation path stops indexing, as when the data is cleared
                  this.logger.info('dropping the index built by the indexer, telling the other tabs first');
                  this.channel.post({ type: 'status', status: undefined });
              });
        this.dbReset.catch((err) => {
            this.logger.error('failed to reset the database between feature flag switches', err);
        });
    }

    /** Everything that opens the database waits for this first, see {@link resetDbBetweenFeatureFlagSwitches}. */
    waitForDbReset() {
        return this.dbReset;
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
        await this.dbReset;
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
                this.logger.info(`index ${newStatus}, telling the other tabs`);
                this.channel.post({ type: 'status', status: newStatus });
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
        this.initialized = true;
        await this.dbReset;
        const statusAndHistoricalFinished = await this.readStatus();
        // Initialized, this tab takes part in electing the one that indexes. Does nothing when it already does.
        this.election.start();
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
                this.logger.info('index complete');
                this.listeners.forEach((l) => l.reportIndexComplete());
            }
        }
    }

    async enable() {
        await this.dbReset;
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
                    // logged by the leader only, as every tab reports it
                    this.logger.info(`historic progress: ${processed}/${total}`);
                    this.listeners.forEach((l) => l.reportHistoricProgress(processed, total));
                    this.channel.post({ type: 'progress', processed, total });
                },
                reportError: (err) => {
                    this.listeners.forEach((l) => l.reportError(err));
                },
                reportIndexComplete: () => {
                    this.listeners.forEach((l) => l.reportIndexComplete());
                    this.logger.info('index complete, telling the other tabs');
                    this.channel.post({ type: 'indexComplete' });
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
                await this.dbReset;
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
        // An in-flight path switch could recreate the database after we delete it. Its failure must not stop
        // the user from clearing their data, see `resetDbBetweenFeatureFlagSwitches`.
        await this.dbReset.catch(noop);
        // Cancel any running import to avoid blocked connections
        this.importHandle?.value?.stop();
        this.workerQueue = [];
        this.pauseController?.abort();
        await this.indexationPromise;
        // Before deleting: the leader stops its worker as it would on pause, rather than have it fail once its
        // connection is closed under it, still believing indexing is enabled.
        this.logger.info('deleting the index, telling the other tabs first');
        this.channel.post({ type: 'status', status: undefined });

        await deleteContentSearchDB(this.userId);
        // The in-memory status mirrors the DB we just deleted. Keeping it would make `enable()` believe
        // it's already enabled and skip writing the status and starting the worker.
        this.status = undefined;
        // This tab doesn't receive its own broadcast.
        this.listeners.forEach((l) => {
            l.reportStatusUpdate(undefined);
        });
    }
}

let sharedIndexService: IndexService | undefined;
export function getSharedIndexService(
    userId: string,
    appVersion: string,
    api: Api,
    getUserKeys: () => Promise<DecryptedKey<PrivateKeyReference>[]>,
    getMessageKeys: GetMessageKeys,
    logger: Logger
) {
    if (!sharedIndexService) {
        sharedIndexService = new IndexService(
            userId,
            api,
            getUserKeys,
            getMessageKeys,
            logger,
            createTabCoordination({ userId, logger }),
            appVersion
        );
    }
    return sharedIndexService;
}

let sharedIndexServiceUsers = 0;

/**
 * Keeps the shared index service alive while a component uses it. Returns the release: once the last user released
 * it, it's disposed and forgotten, so the next `getSharedIndexService` creates a new one. A remount renders the new
 * component with the same instance before the old one releases it, then retains it again in the same commit, so the
 * release waits a microtask before disposing.
 */
export function retainSharedIndexService(): () => void {
    sharedIndexServiceUsers++;
    return () => {
        sharedIndexServiceUsers--;
        queueMicrotask(() => {
            if (sharedIndexServiceUsers === 0 && sharedIndexService) {
                sharedIndexService.dispose();
                sharedIndexService = undefined;
            }
        });
    };
}

/**
 * Gets the sharedIndexService for the given user, if it exists.
 */
export function getExistingIndexService(userId: string): IndexService | undefined {
    return sharedIndexService?.userId === userId ? sharedIndexService : undefined;
}
