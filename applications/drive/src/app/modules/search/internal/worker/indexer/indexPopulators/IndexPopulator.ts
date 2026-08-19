import type { DriveEvent } from '@protontech/drive-sdk';

import type { IndexPopulatorState, RepairNodeEntry, SearchDB } from '../../../shared/SearchDB';
import { sendErrorReportForSearch } from '../../../shared/errors';
import type { IndexPopulatorStatus, IndexingProgress, TreeEventScopeId } from '../../../shared/types';
import type { IndexKind } from '../../index/IndexRegistry';
import type { TaskContext } from '../tasks/BaseTask';

/**
 * Lifecycle and state for populating and maintaining a search index.
 *
 * This base is agnostic of the data source AND of how indexing is carried out: it knows nothing
 * about nodes, folder trees, traversal, or the resumable drain. It owns the index-population
 * lifecycle — generation/version/done bookkeeping and progress — and declares the two contracts a
 * concrete populator must fulfil: how to run initial population (`populate`) and how to apply
 * incremental updates (`processIncrementalUpdates`). How those are implemented (resumable folder
 * walk, chunked drain, etc.) lives in subclasses such as NodeTreeIndexPopulator.
 */
export abstract class IndexPopulator {
    constructor(
        // Subscription scope for incremental updates after initial indexing.
        readonly treeEventScopeId: TreeEventScopeId,

        // Target index for entries produced by this populator.
        // This is how multi-index writes are made possible.
        readonly indexKind: IndexKind,

        // Discriminator for this IndexPopulator type, e.g. "myfiles", "photos", "shared-with-me".
        readonly indexPopulatorKind: string,

        // Schema version of this populator's output. Bumped when the shape of
        // indexed attributes changes, so stale entries can be detected and re-indexed.
        readonly version: number
    ) {}

    // In-memory indexing progress. Persisted alongside each resume checkpoint and
    // on completion. NOTE: counts are approximate across a crash-resume because the
    // re-walked chunk re-increments them; treat as best-effort for the progress UI.
    // Owned here (reset/save/report); subclasses increment it as they index items.
    protected progress: IndexingProgress = { files: 0, folders: 0, albums: 0, photos: 0 };

    async getStatus(db: SearchDB): Promise<IndexPopulatorStatus> {
        const state = await this.ensureState(db);

        if (state.done) {
            return {
                done: true,
                // Indexing already done, return the persisted progress
                progress: state.progress,
            };
        }

        return {
            done: false,
            // Return in memory progress.
            progress: this.progress,
        };
    }

    static buildUid(indexPopulatorKind: string, treeEventScopeId: TreeEventScopeId): string {
        return `${indexPopulatorKind}:${treeEventScopeId}`;
    }

    protected async ensureState(db: SearchDB): Promise<IndexPopulatorState> {
        const state = await db.getPopulatorState(this.getUid());
        if (!state) {
            const newState: IndexPopulatorState = {
                uid: this.getUid(),
                indexKind: this.indexKind,
                indexPopulatorKind: this.indexPopulatorKind,
                treeEventScopeId: this.treeEventScopeId,
                done: false,
                generation: 1,
                version: this.version,
                progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            };
            await db.putPopulatorState(newState);
            return newState;
        }
        return state;
    }

    getUid(): string {
        return IndexPopulator.buildUid(this.indexPopulatorKind, this.treeEventScopeId);
    }

    getVersion(): number {
        return this.version;
    }

    // Generation counter. Bumped each time we make the populator dirty (e.g. not done) and reindex itself.
    // It's used to GC leftover entries from the index by previous generations.
    // Example:
    //  — Tree refresh (we mark the whole index dirty for this index populator)
    //  - If the user change the configuration of a given indexpopulator (e.g. deactivate file content from indexing, disable
    //    an index populator, etc)
    async getGeneration(db: SearchDB): Promise<number> {
        const state = await this.ensureState(db);
        return state.generation;
    }

    async hasUpToDateVersion(db: SearchDB): Promise<boolean> {
        const state = await this.ensureState(db);
        return state.version === this.version;
    }

    async isDone(db: SearchDB): Promise<boolean> {
        const state = await this.ensureState(db);
        return state.done === true;
    }

    async markAsNotDone(db: SearchDB): Promise<void> {
        const state = await this.ensureState(db);
        const nextGeneration = state.generation + 1;
        await db.putPopulatorState({
            ...state,
            done: false,
            generation: nextGeneration,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
        });

        this.progress = { files: 0, folders: 0, albums: 0, photos: 0 };
    }

    async markAsDone(db: SearchDB): Promise<void> {
        const state = await this.ensureState(db);
        await db.putPopulatorState({ ...state, done: true, version: this.version, progress: this.progress });
    }

    /**
     * Whether initial indexing has already failed at least once (see
     * IndexPopulatorState.initialIndexingFailed). Falls back to false if the read fails: this only
     * labels a metric, so it must never block the real error from being classified and reported.
     */
    async hasInitialIndexingFailed(db: SearchDB): Promise<boolean> {
        try {
            const state = await this.ensureState(db);
            return state.initialIndexingFailed === true;
        } catch (error) {
            sendErrorReportForSearch('Unable to read initialIndexingFailed for index populator', error);
            return false;
        }
    }

    /** Set the sticky failure bit. Swallows write failures: it must never block retry scheduling. */
    async markInitialIndexingFailed(db: SearchDB): Promise<void> {
        try {
            const state = await this.ensureState(db);
            await db.putPopulatorState({ ...state, initialIndexingFailed: true });
        } catch (error) {
            sendErrorReportForSearch('Unable to persist initialIndexingFailed for index populator', error);
        }
    }

    /**
     * Clear the sticky failure bit once a run has succeeded, so the next campaign starts clean.
     * Swallows write failures: throwing would make the queue treat a completed index as a failed task.
     */
    async clearInitialIndexingFailed(db: SearchDB): Promise<void> {
        try {
            const state = await this.ensureState(db);
            await db.putPopulatorState({ ...state, initialIndexingFailed: false });
        } catch (error) {
            sendErrorReportForSearch('Unable to clear initialIndexingFailed for index populator', error);
        }
    }

    /**
     * Persist in-progress indexing progress to the populator state row.
     * Called by subclasses alongside checkpoint saves so the counters survive a crash-resume.
     */
    protected async saveProgress(db: SearchDB): Promise<void> {
        const state = await this.ensureState(db);
        await db.putPopulatorState({ ...state, progress: this.progress });
    }

    /**
     * Restore in-memory progress from the DB row. Called by subclasses on resume
     * (when a checkpoint exists) so the progress bar doesn't reset to zero.
     */
    protected async restoreProgressFromDB(db: SearchDB): Promise<void> {
        const state = await db.getPopulatorState(this.getUid());
        if (state) {
            this.progress = { ...state.progress };
        }
    }

    /**
     * Run initial population of the index and mark the populator done on success. Implemented by
     * the concrete populator, which owns how indexing is carried out (e.g. a resumable folder walk).
     */
    abstract populate(ctx: TaskContext): Promise<void>;

    /**
     * Apply a batch of incremental change events, returning how many were successfully processed
     * (the caller commits only that prefix). Implemented by the concrete populator, which owns all
     * knowledge of the data source's change model.
     */
    abstract processIncrementalUpdates(events: DriveEvent[], ctx: TaskContext): Promise<number>;

    /**
     * Replay a single quarantined node's pending index operation (see {@link RepairNodeEntry}).
     * Throws on failure; RepairFailedNodesTask decides retry vs. re-throw. Implemented by the
     * concrete populator, which owns the node → index mapping.
     */
    abstract repairNode(entry: RepairNodeEntry, ctx: TaskContext): Promise<void>;
}
