import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';

import type { MainThreadBridge } from '../../mainThread/MainThreadBridge';
import { Logger } from '../../shared/Logger';
import type { SearchDB } from '../../shared/SearchDB';
import { SEARCH_EVICTION_TRIGGER_RATIO, SEARCH_MAX_INDEXED_DOCUMENTS } from '../../shared/config';
import { deleteLegacyEncryptedSearchDb } from '../../shared/encryptedSearchUtils';
import type { PermanentErrorKind } from '../../shared/errors';
import {
    DEFAULT_RETRY_AFTER_IN_MS,
    classifyError,
    computeBackoff,
    sendErrorReportForSearch,
} from '../../shared/errors';
import type { SearchMetrics } from '../../shared/searchMetrics';
import type { IndexPopulatorStatus, UserId } from '../../shared/types';
import { brandTreeEventScopeId } from '../../shared/types';
import type { IndexRegistry } from '../index/IndexRegistry';
import { IndexKind } from '../index/IndexRegistry';
import { gatherSearchDiagnostics } from '../searchDiagnostics';
import { OnlineMonitor } from './OnlineMonitor';
import type { TreeSubscriptionRegistry } from './TreeSubscriptionRegistry';
import type { IndexPopulator } from './indexPopulators/IndexPopulator';
import { MyFilesIndexPopulator } from './indexPopulators/MyFilesIndexPopulator';
import type { BaseTask, TaskContext } from './tasks/BaseTask';
import { CleanUpStaleBlobsTask } from './tasks/CleanUpTasks/CleanUpStaleBlobsTask';
import { CleanUpStaleIndexEntryTask } from './tasks/CleanUpTasks/CleanUpStaleIndexEntryTask';
import { EvictIndexEntriesTask } from './tasks/CleanUpTasks/EvictIndexEntriesTask';
import { IncrementalUpdateTask } from './tasks/CoreTasks/IncrementalUpdateTask';
import { IndexPopulatorTask } from './tasks/CoreTasks/IndexPopulatorTask';
import { PersistDataTask } from './tasks/CoreTasks/PersistDataTask';
import { RepairFailedNodesTask } from './tasks/CoreTasks/RepairFailedNodesTask';

export type IndexerState = {
    isIndexing: boolean;
    isSearchable: boolean;
    permanentError: PermanentErrorKind | null;
    indexPopulatorStatuses: IndexPopulatorStatus[];
    isIndexPartial: boolean;
};

export const DEFAULT_INDEXER_STATE: IndexerState = {
    isIndexing: false,
    isSearchable: false,
    permanentError: null,
    indexPopulatorStatuses: [],
    isIndexPartial: false,
};

// How often the indexer task queue reports indexing progress to the main thread.
const PROGRESS_NOTIFY_THROTTLE_MS = 300;

// Age after which a resumable BFS visitor checkpoint is considered abandoned and reaped at startup.
// An actively-resuming walk refreshes its checkpoint's updatedAt on every commit, so it never ages
// out; only markers whose triggering work will never resume (e.g. a folder deleted after a crash
// mid-reindex) get this old. Generous by design, the visitor stale should be
// managed by the task loop lifecycle, this is only a safeguard for DB leaks.
const STALE_BFS_VISITOR_STATE_MS = 7 * 24 * 60 * 60 * 1000;

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

    // Per-task retry counter for backoff. Keyed by task UID and reset on success.
    private taskAttempts = new Map<string, number>();

    private readonly onlineMonitor = new OnlineMonitor();

    private state: IndexerState = {
        isIndexing: false,
        isSearchable: false,
        permanentError: null,
        indexPopulatorStatuses: [],
        isIndexPartial: false,
    };
    private stateListeners = new Set<IndexerStateListener>();

    private progressNotifyTimeout: ReturnType<typeof setTimeout> | null = null;
    private processLoopDone: Promise<void> = Promise.resolve();

    constructor(
        private readonly userId: UserId,
        private readonly indexRegistry: IndexRegistry,
        private readonly bridge: MainThreadBridge,
        private readonly db: SearchDB,
        treeSubscriptionRegistry: TreeSubscriptionRegistry,
        private readonly searchMetrics: SearchMetrics
    ) {
        this.treeSubscriptionRegistry = treeSubscriptionRegistry;
    }

    private postBootstrapTasks: BaseTask[] = [];

    async start(): Promise<void> {
        // Assigned before any await so a stop() concurrent with the startup sequence below
        // (isSearchable/createTasks - the latter makes a network call) waits for this whole
        // method to actually finish, rather than resolving against a stale, already-settled
        // promise and reporting "the loop has exited" before it has even started.
        this.processLoopDone = this.startAndRunProcessLoop();
        await this.processLoopDone;
    }

    private async startAndRunProcessLoop(): Promise<void> {
        Logger.info('IndexerTaskQueue: starting');
        this.stopped = false;
        this.abortController = new AbortController();

        // Reap abandoned resumable-walk checkpoints (never active ones - those keep their
        // updatedAt fresh). Fire-and-forget: it must not block indexing startup.
        this.db.deleteStaleBFSVisitorStates(STALE_BFS_VISITOR_STATE_MS).catch((error: unknown) => {
            Logger.error('IndexerTaskQueue: failed to reap stale BFS visitor states', error);
        });

        const { bootstrapTasks, postBootstrapTasks } = await this.createTasks();
        this.postBootstrapTasks = postBootstrapTasks;
        for (const task of bootstrapTasks) {
            this.enqueue(task);
        }

        // Broadcast the first real snapshot only once `this.populators` is populated (createTasks
        // above), so buildStatusFields() reads actual persisted capped/done state instead of
        // reporting an empty, non-partial index just because no populator is registered yet.
        const isSearchable = await this.db.isSearchable();
        await this.updateState({ isSearchable });

        await this.processLoop();
    }

    async stop(): Promise<void> {
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

        this.taskAttempts.clear();
        this.onlineMonitor.cancelWaits();

        this.populators.clear();

        // Wait for processLoop to actually exit before returning, so callers can safely
        // disposeAll() the engine right after stop().
        await this.processLoopDone.catch((error: unknown) =>
            this.searchMetrics.markSearchOtherError({ error, message: 'IndexerTaskQueue: processLoop failed' })
        );
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
        this.state = { ...this.state, ...(await this.buildStatusFields()) };
        this.stateListeners.forEach((cb) => cb(this.state));
    }

    private buildIndexPopulatorStatuses(): Promise<IndexPopulatorStatus[]> {
        return Promise.all([...this.populators.values()].map((p) => p.getStatus(this.db)));
    }

    // Single source of truth for the two IndexerState fields derived from populator statuses, so
    // the two `updateState`/`refreshIndexPopulatorStatuses` call sites can't disagree about
    // isIndexPartial the way they briefly did for indexPopulatorStatuses alone.
    private async buildStatusFields(): Promise<Pick<IndexerState, 'indexPopulatorStatuses' | 'isIndexPartial'>> {
        const statuses = await this.buildIndexPopulatorStatuses();
        return { indexPopulatorStatuses: statuses, isIndexPartial: statuses.some((s) => s.capped) };
    }

    private async areBootstrapPopulatorsDone(): Promise<boolean> {
        const done = await Promise.all([...this.populators.values()].map((p) => p.isDone(this.db)));
        return done.every(Boolean);
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
        this.enqueueOnce(new IndexPopulatorTask(populator));
    }

    private async processLoop(): Promise<void> {
        const signal = this.abortController.signal;

        while (!this.stopped && !signal.aborted) {
            // Freeze the entire indexer while the monitor reports offline.
            await this.onlineMonitor.waitForOnline();

            if (this.stopped || signal.aborted) {
                break;
            }

            const task = this.queue.shift();
            if (!task) {
                // Only announce searchable once the bootstrap populators are actually done:
                // chunked commits mean a transient-retry gap can drain the queue with a partially
                // committed index. After bootstrap, re-indexes keep the last complete index visible
                // (entries upsert in place under a new generation), so we don't hide search during
                // a re-index. Persist it so search stays interactive on the next reload before
                // indexing runs again.
                const isFirstDrain = !this.bootstrapDone;
                const isSearchable = this.bootstrapDone || (await this.areBootstrapPopulatorsDone());
                if (isSearchable) {
                    await this.db.markSearchableIndex();
                }
                await this.updateState({ isIndexing: false, isSearchable });

                if (isFirstDrain) {
                    this.bootstrapDone = true;
                    this.observeStartupIndexStats();
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

                // stop() may have fired its one-shot wakeUp() while this drain was still in
                // flight (it's all async work above), before waitForWork() created the promise
                // it's meant to resolve. Without this check that promise would never resolve and
                // stop() -> processLoopDone would hang forever.
                if (this.stopped || signal.aborted) {
                    break;
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

            // Demand-driven, not periodic: an incremental update is exactly the moment the
            // index entry count can have crossed the trigger. Checking here (rather than in
            // postBootstrapTasks) means a full index scan only ever runs for users actually near
            // the cap, not on every worker start.
            if (task instanceof IncrementalUpdateTask) {
                await this.maybeEnqueueEviction();
            }
        }
    }

    // Enqueues an EvictIndexEntriesTask if the index exceeds the eviction trigger. A cheap check
    // (one IndexedDB read via getIndexEntryCount) - the expensive full-index scan only happens
    // inside EvictIndexEntriesTask itself, and only once it has decided a sweep is actually needed.
    private async maybeEnqueueEviction(): Promise<void> {
        const trigger = Math.round(SEARCH_MAX_INDEXED_DOCUMENTS * SEARCH_EVICTION_TRIGGER_RATIO);
        const count = await this.db.getIndexEntryCount(IndexKind.MAIN);
        if (count !== undefined && count > trigger) {
            this.enqueueOnce(new EvictIndexEntriesTask(IndexKind.MAIN));
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
            searchMetrics: this.searchMetrics,
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
            notifyIndexingProgress: () => this.notifyIndexingProgress(),
            activeIndexPopulators: [...this.populators.values()],
            getIndexPopulator: (uid: string) => this.populators.get(uid),
        };

        const uid = task.getUid();
        try {
            Logger.info(`IndexerTaskQueue - Starting task: ${uid}`);
            await task.execute(ctx);
            this.taskAttempts.delete(uid);
            this.searchMetrics.markIndexerTaskSucceeded({ taskUid: uid, taskKind: task.getKind() });
        } catch (e) {
            // This signal is ours and never leaves the worker, so if it fired we really are
            // stopping and dropping the error is correct. Deliberately not isAbortError(e): an
            // abort raised anywhere else, relayed from the main thread or from an unrelated
            // timeout, is an ordinary failure. Returning for one of those would skip both the
            // metric and the re-enqueue below, stalling the populator with no trace.
            if (signal.aborted) {
                return;
            }

            // Classify here, in the worker, while the error prototype is still intact.
            const decision = classifyError(e);

            // Persisted, so a retry after a worker restart isn't mislabelled as the first attempt.
            // `taskAttempts` can't answer this: it's in-memory and dies with the worker.
            const hadFailedBefore =
                task instanceof IndexPopulatorTask ? await task.populator.hasInitialIndexingFailed(this.db) : false;

            // Gathered here, in the worker, and passed as plain data: `markIndexerError` may run
            // across the Comlink worker bridge, which can only structured-clone plain values, not
            // live callbacks back into this class. Skipped for `offline` - that path never opens a
            // Sentry issue, so gathering it would just be wasted IndexedDB reads on every flaky
            // network hiccup.
            const isOffline = decision.kind === 'transient' && decision.reason === 'offline';
            const diagnostics = isOffline ? undefined : await gatherSearchDiagnostics(this.db, this.indexRegistry);

            this.searchMetrics.markIndexerError({
                decision,
                error: e,
                taskUid: uid,
                taskKind: task.getKind(),
                isInitialIndexing: task instanceof IndexPopulatorTask,
                isIncrementalUpdate: task instanceof IncrementalUpdateTask,
                isInitialAttempt: !hadFailedBefore,
                taskAttemptCount: this.taskAttempts.get(uid) ?? 0,
                diagnostics,
            });

            // Only written on the false -> true transition, so at most one write per index flow.
            if (task instanceof IndexPopulatorTask && !hadFailedBefore) {
                await task.populator.markInitialIndexingFailed(this.db);
            }

            if (decision.kind === 'permanent') {
                this.taskAttempts.delete(uid);
                await this.updateState({ permanentError: decision.reason });
                // Fire-and-forget: this runs inside processLoop (via run()), and stop() now
                // awaits processLoopDone - awaiting it here would deadlock the loop on itself.
                this.stop().catch((error: unknown) =>
                    this.searchMetrics.markSearchOtherError({ error, message: 'IndexerTaskQueue: stop() failed' })
                );
                return;
            }

            // Transient: queue owns retry policy.
            const currentAttemptCount = (this.taskAttempts.get(uid) ?? 0) + 1;
            this.taskAttempts.set(uid, currentAttemptCount);

            // Only IndexPopulatorTask re-enqueues itself on transient failure.
            // Other task types (maintenance) rely on their own scheduling mechanism.
            if (task instanceof IndexPopulatorTask) {
                const delayMs =
                    decision.reason === 'rate-limited'
                        ? DEFAULT_RETRY_AFTER_IN_MS
                        : computeBackoff(currentAttemptCount);
                ctx.enqueueDelayed(task, delayMs);
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
            bootstrapTasks: [new IndexPopulatorTask(myFilesPopulator)],
            postBootstrapTasks: [
                new CleanUpStaleIndexEntryTask(),
                new CleanUpStaleBlobsTask(),
                new RepairFailedNodesTask(),
            ],
        };
    }

    private observeStartupIndexStats(): void {
        Promise.all(
            [...this.indexRegistry.getAll()].map(async ({ indexKind }) => {
                const sizeBytes = await this.db.getIndexBlobsByteSize(indexKind);
                this.searchMetrics.markIndexSizeOnInit({ sizeMb: sizeBytes / 1024 / 1024 });
            })
        ).catch((error) => sendErrorReportForSearch('IndexerTaskQueue: startup index stats observation failed', error));
    }

    private async updateState(patch: Partial<IndexerState>): Promise<void> {
        // Sync change detection before any DB work so redundant markIndexing
        // calls don't each trigger a populator read.
        const changed = Object.keys(patch).some(
            (k) => patch[k as keyof IndexerState] !== this.state[k as keyof IndexerState]
        );
        if (!changed) {
            return;
        }
        // This refresh subsumes any pending throttled one (it reads fresher/equal data), so cancel
        // it - otherwise it fires later with a stale `this.state` base and rebroadcasts redundantly.
        // Only cancel here, on the path that actually refreshes: a `!changed` call above must leave
        // a pending refresh alone, since it is the only thing that will still pick up a
        // populator-only change (e.g. capped flipping) when isIndexing/isSearchable didn't move.
        if (this.progressNotifyTimeout) {
            clearTimeout(this.progressNotifyTimeout);
            this.progressNotifyTimeout = null;
        }
        // Refresh populator statuses on every broadcast so consumers always see
        // the latest `done` / progress values alongside whatever other field changed.
        const statusFields = await this.buildStatusFields();
        // Re-merge against the latest `this.state` (may have been mutated by a concurrent updateState).
        this.state = { ...this.state, ...patch, ...statusFields };
        this.stateListeners.forEach((cb) => cb(this.state));
    }
}
