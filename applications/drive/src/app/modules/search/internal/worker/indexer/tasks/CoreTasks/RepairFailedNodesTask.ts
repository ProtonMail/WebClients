import { Logger } from '../../../../shared/Logger';
import { isRepairableError } from '../../../../shared/errors';
import { IndexPopulator } from '../../indexPopulators/IndexPopulator';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// How often this task re-enqueues itself (see execute()).
export const REPAIR_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Drains the repair table: replays each due entry (a node quarantined after a node-scoped failure)
 * against the IndexPopulator that owns it.
 *
 * Enqueued once at worker startup (post-bootstrap) and self-reschedule itself.
 */
export class RepairFailedNodesTask extends BaseTask {
    getUid(): string {
        return this.getKind();
    }

    getKind(): IndexerTaskKind {
        return 'repair-failed-nodes-task';
    }

    async execute(ctx: TaskContext): Promise<void> {
        // Scheduled up front so it fires even if this run throws below.
        ctx.enqueueDelayed(new RepairFailedNodesTask(), REPAIR_RETRY_INTERVAL_MS);

        const entries = await ctx.db.getAllDueRepairNodes(Date.now());

        if (entries.length === 0) {
            return;
        }

        Logger.info(`RepairFailedNodesTask: repairing ${entries.length} quarantined node(s)`);

        for (const entry of entries) {
            ctx.signal.throwIfAborted();

            const uid = IndexPopulator.buildUid(entry.indexPopulatorKind, entry.treeEventScopeId);
            const populator = ctx.getIndexPopulator(uid);
            if (!populator) {
                // Populator not registered this session - leave the entry for a run when it's active.
                Logger.warn(`RepairFailedNodesTask: no populator ${uid} for node ${entry.nodeUid}, skipping`);
                continue;
            }

            try {
                await populator.repairNode(entry, ctx);
                await ctx.db.clearRepairNode(entry.indexKind, entry.nodeUid);
                ctx.searchMetrics.markNodeRepaired({ operation: entry.operation });
            } catch (e) {
                if (!isRepairableError(e)) {
                    // A systemic failure is not the node's fault - let the queue handle it.
                    throw e;
                }
                // Retry forever with backoff
                await ctx.db.recordFailedRepairAttempt(entry, e instanceof Error ? e.message : String(e));
                Logger.warn(`RepairFailedNodesTask: repair failed for node ${entry.nodeUid}`);
            }
        }
    }
}
