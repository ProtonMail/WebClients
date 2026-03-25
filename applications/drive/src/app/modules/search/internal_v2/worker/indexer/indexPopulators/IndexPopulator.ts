import type { DriveEvent, NodeEvent } from '@protontech/drive-sdk';

import { Logger } from '../../../shared/Logger';
import type { SearchDB } from '../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../shared/types';
import type { IndexKind } from '../../index/IndexRegistry';
import type { IndexEntry } from '../indexEntry';
import type { TaskContext } from '../tasks/BaseTask';
import { IndexPopulatorTask } from '../tasks/CoreTasks/IndexPopulatorTask';
import { RemoveTreeEventScopeIdTask } from '../tasks/CoreTasks/RemoveTreeEventScopeIdTask';

/**
 * Domain logic for populating and maintaining a search index.
 */
export abstract class IndexPopulator {
    constructor(
        // Subscription scope for incremental updates after initial indexing.
        readonly treeEventScopeId: TreeEventScopeId,

        // Target index for entries produced by this populator.
        // This is how multi-index writes are made possible.
        readonly indexKind: IndexKind,

        // Unique identifier for this IndexPopulator type e.g. "my-files"
        readonly indexPopulatorId: string,

        // Schema version of this populator's output. Bumped when the shape of
        // indexed attributes changes, so stale entries can be detected and re-indexed.
        protected version: number,

        // Scan generation counter. Bumped on each full re-index.
        // Used to GC leftover entries from the previous scan.
        // Example:
        //  — Tree refresh
        //  - If the user change the configuration of a given indexpopulator (e.g. deactivate file content from indexing)
        protected generation: number
    ) {}

    static buildUid(indexPopulatorId: string, treeEventScopeId: TreeEventScopeId): string {
        return `${indexPopulatorId}:${treeEventScopeId}`;
    }

    protected static async loadOrCreateState(
        indexPopulatorId: string,
        treeEventScopeId: TreeEventScopeId,
        db: SearchDB
    ) {
        const uid = IndexPopulator.buildUid(indexPopulatorId, treeEventScopeId);
        let state = await db.getPopulatorState(uid);
        if (!state) {
            state = { uid, done: false, generation: 1 };
            await db.putPopulatorState(state);
        }
        return state;
    }

    getUid(): string {
        return IndexPopulator.buildUid(this.indexPopulatorId, this.treeEventScopeId);
    }

    getGeneration(): number {
        return this.generation;
    }

    abstract visitAndProduceIndexEntries(ctx: TaskContext): AsyncIterableIterator<IndexEntry>;

    async processIncrementalUpdates(events: DriveEvent[], ctx: TaskContext): Promise<void> {
        Logger.info(`${this.getUid()}: processing ${events.length} incremental events`);

        for (const event of events) {
            switch (event.type) {
                case 'node_created':
                case 'node_updated':
                case 'node_deleted':
                    await this.processNodeMutation(event, ctx);
                    break;

                case 'fast_forward':
                    // NOTE: Update to latest event ID - this is already the default behavior. This fires
                    // when the cursor is idle for too long (no relevant events, or events for scopes we don't
                    // have access to), preventing the old event ID from being garbage-collected server-side.
                    break;

                case 'tree_refresh':
                    Logger.info(
                        `${this.getUid()}: TreeRefresh, bumped to generation ${this.generation}, request new indexing.`
                    );
                    this.generation++;
                    // Persist the bumped generation as not-done so the next execute() re-indexes.
                    await ctx.db.putPopulatorState({
                        uid: this.getUid(),
                        done: false,
                        generation: this.generation,
                    });

                    ctx.enqueueOnce(new IndexPopulatorTask(this, false /* isBootstrap */));
                    break;

                case 'tree_remove':
                    Logger.info(`${this.getUid()}: TreeRemove, scope cleanup needed`);
                    ctx.enqueueOnce(new RemoveTreeEventScopeIdTask(this.treeEventScopeId));
                    break;

                case 'shared_with_me_updated':
                    // TODO: Shared volumes changed — may need to add/remove scope subscriptions.
                    // Not implemented yet but the idea will be:
                    //  - For additions: enqueue a new SharedWithMeIndexPopulator (make sure it fetch and compare new shared tree event scopes)
                    //  - For removals: enqueue a CleanUpTreeEventScopeIdTask
                    Logger.info(`${this.getUid()}: SharedWithMeUpdated`);
                    break;
            }
        }
    }

    async processNodeMutation(event: NodeEvent, _ctx: TaskContext): Promise<void> {
        // TODO: Handle node mutations:
        //
        // First: Check node uid (or parent uid for creation) and check that it belongs to the current index.
        //
        // NodeCreated:
        //   - Fetch node via bridge using event.nodeUid
        //   - Build IndexEntry with createIndexEntry()
        //   - Insert into engine via indexWriter.startWriteSession()
        //
        // NodeUpdated:
        //   - Fetch node via bridge using event.nodeUid
        //   - Remove old entry: session.remove(event.nodeUid)
        //   - Insert updated entry: session.insert(createIndexEntry(...))
        //   - If parent changed (node moved): update path for all descendants too
        //
        // NodeDeleted:
        //   - Remove entry: session.remove(event.nodeUid) and remove all descendants from index.
        //
        // isTrashed (on NodeCreated/NodeUpdated):
        //   - If event.isTrashed: treat as delete (remove entry) and remove all descendants from index.
        //
        Logger.info(
            `${this.getUid()}: processNodeMutation ${event.type} for node ${event.nodeUid} (not yet implemented)`
        );
    }
}
