import { getNodeEntity } from '../../../../../utils/sdk/getNodeEntity';
import type { MainThreadBridge } from '../../mainThread/MainThreadBridge';
import { Logger } from '../../shared/Logger';
import type { SearchDB } from '../../shared/SearchDB';
import { deleteLegacyEncryptedSearchDb } from '../../shared/encryptedSearchUtils';
import type { PermanentErrorKind } from '../../shared/errors';
import { classifyPermanentError, isAbortError, sendErrorReportForSearch } from '../../shared/errors';
import type { IndexPopulatorStatus, UserId } from '../../shared/types';
import { brandTreeEventScopeId } from '../../shared/types';
import type { IndexRegistry } from '../index/IndexRegistry';
import type { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';
import type { IndexPopulator } from './indexPopulators/IndexPopulator';
import { MyFilesIndexPopulator } from './indexPopulators/MyFilesIndexPopulator';
import type { BaseTask, TaskContext } from './tasks/BaseTask';
import { CleanUpStaleBlobsTask } from './tasks/CleanUpTasks/CleanUpStaleBlobsTask';
import { CleanUpStaleIndexEntryTask } from './tasks/CleanUpTasks/CleanUpStaleIndexEntryTask';
import { IncrementalUpdateTask } from './tasks/CoreTasks/IncrementalUpdateTask';
import { IndexPopulatorTask } from './tasks/CoreTasks/IndexPopulatorTask';
import { PersistDataTask } from './tasks/CoreTasks/PersistDataTask';

export type IndexerState = {
    isInitialIndexing: boolean;
    isIndexing: boolean;
    isSearchable: boolean;
    permanentError: PermanentErrorKind | null;
    indexPopulatorStatuses: IndexPopulatorStatus[];
};

export const DEFAULT_INDEXER_STATE: IndexerState = {
    isInitialIndexing: false,
    isIndexing: false,
    isSearchable: false,
    permanentError: null,
    indexPopulatorStatuses: [],
};

// How often the indexer task queue reports indexing progress to the main thread.
const PROGRESS_NOTIFY_THROTTLE_MS = 300;

export type IndexerStateListener = (state: IndexerState) => void;

/**
 * FIFO task queue for indexing operations.
 *
 * Runs tasks sequentially, tracks indexer state, and handles errors.
 * After bootstrap, incremental updates are driven by TreeSubscriptionRegistry
 * (event-driven with debounce), while maintenance tasks self-schedule.
 */
export class IndexerTaskQueue {
    private readonly treeSubscriptionRegistry: TreeSubscriptionRegistry;

    private populators = new Map<string, IndexPopulator>();
    private queue: BaseTask[] = [];
    private stopped = false;
    private abortController = new AbortController();
    private wakeUp: (() => void) | null = null;
    private previousTask: BaseTask | null = null;
    private bootstrapDone = false;
    private pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

    private state: IndexerState = {
        isInitialIndexing: false,
        isIndexing: false,
        isSearchable: false,
        permanentError: null,
        indexPopulatorStatuses: [],
    };
    private stateListeners = new Set<IndexerStateListener>();

    private progressNotifyTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly userId: UserId,
        private readonly indexRegistry: IndexRegistry,
        private readonly bridge: MainThreadBridge,
        private readonly db: SearchDB,
        treeSubscriptionRegistry: TreeSubscriptionRegistry
    ) {
        this.treeSubscriptionRegistry = treeSubscriptionRegistry;
    }

    private postBootstrapTasks: BaseTask[] = [];

    async start(): Promise<void> {
        Logger.info('IndexerTaskQueue: starting');
        this.stopped = false;
        this.abortController = new AbortController();

        const { bootstrapTasks, postBootstrapTasks } = await this.createTasks();
        this.postBootstrapTasks = postBootstrapTasks;
        for (const task of bootstrapTasks) {
            this.enqueue(task);
        }

        await this.processLoop();
    }

    stop(): void {
        this.stopped = true;
        this.abortController.abort();
        this.wakeUp?.();
        for (const timeout of this.pendingTimeouts) {
            clearTimeout(timeout);
        }
        this.pendingTimeouts.clear();
        if (this.progressNotifyTimeout) {
            clearTimeout(this.progressNotifyTimeout);
            this.progressNotifyTimeout = null;
        }
        this.treeSubscriptionRegistry.dispose();

        this.populators.clear();
    }

    notifyIndexingProgress(): void {
        if (this.progressNotifyTimeout) {
            return;
        }
        this.progressNotifyTimeout = setTimeout(() => {
            this.progressNotifyTimeout = null;
            this.refreshIndexPopulatorStatuses().catch((err) =>
                Logger.error('IndexerTaskQueue: refreshIndexPopulatorStatuses failed', err)
            );
        }, PROGRESS_NOTIFY_THROTTLE_MS);
    }

    private async refreshIndexPopulatorStatuses(): Promise<void> {
        const statuses = await this.buildIndexPopulatorStatuses();
        this.state = { ...this.state, indexPopulatorStatuses: statuses };
        this.stateListeners.forEach((cb) => cb(this.state));
    }

    private buildIndexPopulatorStatuses(): Promise<IndexPopulatorStatus[]> {
        return Promise.all([...this.populators.values()].map((p) => p.getStatus(this.db)));
    }

    enqueue(task: BaseTask): void {
        this.queue.push(task);
        this.wakeUp?.();
    }

    enqueueOnce(task: BaseTask): void {
        if (this.queue.some((t) => t.getUid() === task.getUid())) {
            return;
        }
        this.enqueue(task);
    }

    getState(): IndexerState {
        return this.state;
    }

    onStateChange(listener: IndexerStateListener): () => void {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
    }

    // Force re-runnning an index populator - mostly used from debug UI currently.
    async reindexPopulator(uid: string): Promise<void> {
        const populator = this.populators.get(uid);
        if (!populator) {
            Logger.warn(`IndexerTaskQueue: reindexPopulator called with unknown uid: ${uid}`);
            return;
        }
        Logger.info(`IndexerTaskQueue: manually triggering re-index for ${uid}`);
        await populator.markAsNotDone(this.db);
        this.enqueueOnce(new IndexPopulatorTask(populator, false));
    }

    private async processLoop(): Promise<void> {
        const signal = this.abortController.signal;

        while (!this.stopped && !signal.aborted) {
            const task = this.queue.shift();
            if (!task) {
                // Queue is draining — cancel any pending throttled progress refresh so it
                // doesn't fire a late, redundant broadcast after `isSearchable: true`. The
                // snapshot we're about to emit already carries the terminal status.
                if (this.progressNotifyTimeout) {
                    clearTimeout(this.progressNotifyTimeout);
                    this.progressNotifyTimeout = null;
                }
                // All boostrap tasks are done, initial indexing/indexing is done.
                await this.updateState({ isInitialIndexing: false, isIndexing: false, isSearchable: true });

                if (!this.bootstrapDone) {
                    this.bootstrapDone = true;
                    for (const task of this.postBootstrapTasks) {
                        this.enqueue(task);
                    }
                    this.postBootstrapTasks = [];

                    // Clean up legacy encrypted-search DB now that initial indexing is done.
                    deleteLegacyEncryptedSearchDb(this.userId).catch((error: unknown) => {
                        sendErrorReportForSearch('Failed to delete legacy search DB', error);
                    });

                    // Wire registry → task queue: registry decides *when*, queue creates the task.
                    this.treeSubscriptionRegistry.startIncrementalUpdateScheduling((registration) => {
                        this.enqueueOnce(new IncrementalUpdateTask(registration));
                        this.enqueueOnce(new CleanUpStaleBlobsTask());
                    });
                }

                // Skip waiting if tasks were enqueued (e.g. by postBootstrapTasks).
                if (this.queue.length > 0) {
                    continue;
                }

                await this.waitForWork();
                continue;
            }
            await this.run(task, signal);
            this.previousTask = task;

            // Persist data after every index modification (either initial or incremental update).
            if (this.shouldPersistData()) {
                const persistDataTask = new PersistDataTask();
                await this.run(persistDataTask, signal);
                this.previousTask = persistDataTask;
            }
        }
    }

    private shouldPersistData(): boolean {
        // NOTE: For now, we simply persist data after every index modifying task. However, we might want to change this heuristic
        // in the future. For instance, if the sync takes a long time (e.g. if we need to encrypt a 1gb index), we might want to
        // detect that and reduce the frequency of syncs (in particular if we index by chunks in the future).
        return (
            (this.previousTask instanceof IndexPopulatorTask || this.previousTask instanceof IncrementalUpdateTask) &&
            !(this.previousTask instanceof PersistDataTask)
        );
    }

    private async run(task: BaseTask, signal: AbortSignal): Promise<void> {
        const ctx: TaskContext = {
            bridge: this.bridge,
            db: this.db,
            indexRegistry: this.indexRegistry,
            treeSubscriptionRegistry: this.treeSubscriptionRegistry,
            signal,
            markIndexing: () => {
                this.updateState({ isIndexing: true }).catch((err) =>
                    Logger.error('IndexerTaskQueue: markIndexing updateState failed', err)
                );
            },
            enqueueOnce: (t: BaseTask) => this.enqueueOnce(t),
            enqueueDelayed: (t: BaseTask, delayMs: number) => {
                const timeout = setTimeout(() => {
                    this.pendingTimeouts.delete(timeout);
                    this.enqueueOnce(t);
                }, delayMs);
                this.pendingTimeouts.add(timeout);
            },
            markInitialIndexing: () => {
                this.updateState({ isInitialIndexing: true }).catch((err) =>
                    Logger.error('IndexerTaskQueue: markInitialIndexing updateState failed', err)
                );
            },
            notifyIndexingProgress: () => this.notifyIndexingProgress(),
            activeIndexPopulators: [...this.populators.values()],
        };

        try {
            Logger.info(`IndexerTaskQueue - Starting task: ${task.getUid()}`);
            await task.execute(ctx);
        } catch (e) {
            if (isAbortError(e) || signal.aborted) {
                return;
            }

            const permanentErrorKind = classifyPermanentError(e);
            if (permanentErrorKind) {
                // TODO: monitor in graphana
                sendErrorReportForSearch(
                    `IndexerTaskQueue: permanent error (${permanentErrorKind}) in ${task.getUid()}`,
                    e
                );

                // Notify user of the search module for handling.
                await this.updateState({
                    permanentError: permanentErrorKind,
                });
                this.stop();
                return;
            }

            // TODO: monitor in graphana
            if (task instanceof IndexPopulatorTask) {
                // TODO: Add a max re-enqueue counter in the task to avoid infinite bootstrap sequences.
                sendErrorReportForSearch(`IndexerTaskQueue: transient error on ${task.getUid()}, re-enqueuing`, e);
                this.enqueueOnce(task);
            } else {
                sendErrorReportForSearch(
                    `IndexerTaskQueue: transient error on ${task.getUid()}, will retry on next cycle`,
                    e
                );
            }
        }
    }

    private waitForWork(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.wakeUp = () => resolve();
        });
    }

    protected async createTasks(): Promise<{ bootstrapTasks: BaseTask[]; postBootstrapTasks: BaseTask[] }> {
        const maybeNode = await this.bridge.driveSdk.getMyFilesRootFolder();
        const { node: rootNode } = getNodeEntity(maybeNode);
        const scopeId = brandTreeEventScopeId(rootNode.treeEventScopeId);

        const myFilesPopulator = new MyFilesIndexPopulator(scopeId);
        this.populators.set(myFilesPopulator.getUid(), myFilesPopulator);

        return {
            bootstrapTasks: [new IndexPopulatorTask(myFilesPopulator, true /* isBootstrap */)],
            postBootstrapTasks: [new CleanUpStaleIndexEntryTask(), new CleanUpStaleBlobsTask()],
        };
    }

    private async updateState(patch: Partial<IndexerState>): Promise<void> {
        // Sync change detection before any DB work so redundant markIndexing/markInitialIndexing
        // calls don't each trigger a populator read.
        const changed = Object.keys(patch).some(
            (k) => patch[k as keyof IndexerState] !== this.state[k as keyof IndexerState]
        );
        if (!changed) {
            return;
        }
        // Refresh populator statuses on every broadcast so consumers always see
        // the latest `done` / progress values alongside whatever other field changed.
        const statuses = await this.buildIndexPopulatorStatuses();
        // Re-merge against the latest `this.state` (may have been mutated by a concurrent updateState).
        this.state = { ...this.state, ...patch, indexPopulatorStatuses: statuses };
        this.stateListeners.forEach((cb) => cb(this.state));
    }
}
