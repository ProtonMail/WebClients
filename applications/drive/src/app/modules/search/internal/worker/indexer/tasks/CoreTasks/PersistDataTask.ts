import { Logger } from '../../../../shared/Logger';
import type { TreeEventScopeId } from '../../../../shared/types';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Flushes in-memory index blobs to IndexedDB and persists event cursor positions, creating a durable checkpoint
// that the indexing will resume from on next reload.
export class PersistDataTask extends BaseTask {
    getUid(): string {
        return 'task-PersistData';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        // Flush pending blob writes to IndexedDB before persisting cursors.
        await Promise.all([...ctx.indexRegistry.getAll()].map((instance) => instance.blobStore.flushToStorage()));

        // Persist the oldest subscription cursor per tree event scope.
        // Multiple registrations may share a tree event scope — persist the oldest cursor
        // so that on reload we resume from the earliest unprocessed event.
        const cursorsByTreeEventScope = new Map<TreeEventScopeId, { lastEventId: string; subscriptionTime: number }>();

        for (const reg of ctx.treeSubscriptionRegistry.getAllRegistrations()) {
            const treeEventScopeId = reg.populator.treeEventScopeId;
            const existing = cursorsByTreeEventScope.get(treeEventScopeId);
            if (!existing || reg.subscriptionTime < existing.subscriptionTime) {
                cursorsByTreeEventScope.set(treeEventScopeId, {
                    lastEventId: reg.lastEventId,
                    subscriptionTime: reg.subscriptionTime,
                });
            }
        }

        for (const [treeEventScopeId, cursor] of cursorsByTreeEventScope) {
            await ctx.db.putSubscription({
                treeEventScopeId,
                lastEventId: cursor.lastEventId,
                lastEventIdTime: cursor.subscriptionTime,
            });
        }
    }
}
