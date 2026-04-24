import type { MainThreadBridge } from '../../../mainThread/MainThreadBridge';
import type { SearchDB } from '../../../shared/SearchDB';
import type { IndexRegistry } from '../../index/IndexRegistry';
import type { TreeSubscriptionRegistry } from '../TreeSubscriptionRegistry';
import type { IndexPopulator } from '../indexPopulators/IndexPopulator';

/**
 * Minimal view of an IndexPopulator exposed to tasks via TaskContext.
 */
export type ActiveIndexPopulator = Pick<IndexPopulator, 'indexPopulatorId' | 'treeEventScopeId'>;

export interface TaskContext {
    readonly bridge: MainThreadBridge;
    readonly db: SearchDB;
    readonly indexRegistry: IndexRegistry;
    readonly treeSubscriptionRegistry: TreeSubscriptionRegistry;
    readonly signal: AbortSignal;
    /** Set isIndexing to true (sticky — stays true until queue empties). */
    readonly markIndexing: () => void;
    /** Set isInitialIndexing to true (sticky — stays true until queue empties). */
    readonly markInitialIndexing: () => void;
    /** Enqueue a task if one with the same UID isn't already queued. */
    readonly enqueueOnce: (task: BaseTask) => void;
    /** Enqueue a task after a delay. The task is deduplicated by UID. */
    readonly enqueueDelayed: (task: BaseTask, delayMs: number) => void;
    /** Request a broadcast of per-populator progress snapshots (throttled by the queue). */
    readonly notifyIndexingProgress: () => void;
    /**
     * Index populators currently registered in the IndexerTaskQueue.
     */
    readonly activeIndexPopulators: readonly ActiveIndexPopulator[];
}

export abstract class BaseTask {
    abstract getUid(): string;
    abstract execute(ctx: TaskContext): Promise<void>;
}
