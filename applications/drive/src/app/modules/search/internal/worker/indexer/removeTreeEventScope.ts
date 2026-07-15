import type { TreeEventScopeId } from '../../shared/types';
import type { TaskContext } from './tasks/BaseTask';

/**
 * Stop tracking a single tree-event scope in response to a tree_remove event.
 *
 * Deletes the scope's populator state (which orphans its index entries so a CleanUpStaleIndexEntryTask
 * sweep removes them), then unregisters the subscription. The DB subscription row is deleted last
 * (inside unregisterByScope) so it acts as the "done" marker: while it exists, an uncommitted
 * tree_remove keeps redriving this until every step succeeds. The caller is responsible for enqueuing
 * the cleanup sweep.
 */
export async function removeTreeEventScope(scopeId: TreeEventScopeId, ctx: TaskContext): Promise<void> {
    // 1. Orphan the scope's index entries by deleting its populator state(s).
    const states = await ctx.db.getAllPopulatorStates();
    for (const state of states) {
        if (state.treeEventScopeId === scopeId) {
            await ctx.db.deletePopulatorState(state.uid);
        }
    }

    // 2. Tear down the subscription LAST: disposes the collector + SDK subscription and deletes the
    //    persisted DB subscription row (the "done" marker).
    await ctx.treeSubscriptionRegistry.unregisterByScope(scopeId);
}
