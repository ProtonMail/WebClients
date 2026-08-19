import { Logger } from '../../../../shared/Logger';
import { startSearchTimer } from '../../../../shared/searchMetrics';
import type { IndexPopulator } from '../../indexPopulators/IndexPopulator';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

/**
 * Task wrapper around an IndexPopulator.
 */
export class IndexPopulatorTask extends BaseTask {
    constructor(readonly populator: IndexPopulator) {
        super();
    }

    getUid(): string {
        return `${this.getKind()}:${this.populator.getUid()}`;
    }

    getKind(): IndexerTaskKind {
        return 'index-populator-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        const { populator } = this;

        // Resolve lastEventId: from DB (previous session) or from API (first time).
        const sub = await ctx.db.getSubscription(populator.treeEventScopeId);
        const lastEventId =
            sub?.lastEventId ?? (await ctx.bridge.fetchLastEventIdForTreeScopeId(populator.treeEventScopeId)).EventID;

        // Always register tree subscription (needed for live events even if scan is done).
        await ctx.treeSubscriptionRegistry.register(populator.treeEventScopeId, populator, lastEventId, Date.now());

        // Version mismatch: schema changed — mark not-done so we re-index.
        if (!(await populator.hasUpToDateVersion(ctx.db))) {
            Logger.info(`${populator.getUid()}: version changed, marking as not done`);
            await populator.markAsNotDone(ctx.db);
        }

        // Skip traversal if already done.
        if (await populator.isDone(ctx.db)) {
            Logger.info(`${populator.getUid()}: already done, skipping`);
            return;
        }

        // Signal that indexing is happening.
        ctx.markIndexing();

        const stopTimer = startSearchTimer();

        // Persisted bit, so a success that follows retries from an earlier worker session is still
        // reported as a retried success. Read before populate() so it reflects state prior to this run.
        const hadFailedBefore = await populator.hasInitialIndexingFailed(ctx.db);

        // Run initial population; the populator marks itself done on success. How it indexes
        // (resumable folder walk, chunked drain, etc.) is the populator's concern.
        await populator.populate(ctx);

        ctx.searchMetrics.markInitialIndexingSucceeded({
            durationInSeconds: stopTimer(),
            isInitialAttempt: !hadFailedBefore,
        });

        // Campaign completed, so the next one starts clean. Cleared only here, on success - never
        // on campaign start (markAsNotDone), which re-fires per retry while the persisted version
        // is stale and would reset the bit before every single failure.
        if (hadFailedBefore) {
            await populator.clearInitialIndexingFailed(ctx.db);
        }
    }
}
