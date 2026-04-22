import type { DriveEvent, MaybeNode, NodeEvent } from '@protontech/drive-sdk';

import type { NodeEntity } from '@proton/drive';
import { NodeType } from '@proton/drive';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import { getNodeEntity } from '../../../../../../utils/sdk/getNodeEntity';
import { Logger } from '../../../shared/Logger';
import type { SearchDB } from '../../../shared/SearchDB';
import { SearchLibraryError } from '../../../shared/errors';
import type { TreeEventScopeId } from '../../../shared/types';
import type { IndexReader } from '../../index/IndexReader';
import type { IndexKind } from '../../index/IndexRegistry';
import type { IndexEntry } from '../indexEntry';
import { createIndexEntry, toCoreNodeFields } from '../indexEntry';
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
        readonly version: number
    ) {}

    static buildUid(indexPopulatorId: string, treeEventScopeId: TreeEventScopeId): string {
        return `${indexPopulatorId}:${treeEventScopeId}`;
    }

    private async ensureState(db: SearchDB) {
        const state = await db.getPopulatorState(this.getUid());
        if (!state) {
            const newState = { uid: this.getUid(), done: false, generation: 1, version: this.version };
            await db.putPopulatorState(newState);
            return newState;
        }
        return state;
    }

    getUid(): string {
        return IndexPopulator.buildUid(this.indexPopulatorId, this.treeEventScopeId);
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
        await db.putPopulatorState({ ...state, done: false, generation: nextGeneration });
    }

    abstract visitAndProduceIndexEntries(ctx: TaskContext): AsyncIterableIterator<IndexEntry>;

    /**
     * Process incremental events. Returns the number of events successfully processed.
     * On failure, remaining events are left unprocessed so the caller can commit only
     * the successfully handled prefix.
     */
    async processIncrementalUpdates(events: DriveEvent[], ctx: TaskContext): Promise<number> {
        Logger.info(`${this.getUid()}: processing ${events.length} incremental events`);

        let processed = 0;

        for (const event of events) {
            switch (event.type) {
                case 'node_created':
                case 'node_updated':
                case 'node_deleted':
                    // Throws on failure — remaining events (including the failing one) will be
                    // retried in the next incremental update. The update might be stuck on this
                    // event but we have no choice since DriveEvents must be processed in order.
                    await this.processNodeMutation(event, ctx);
                    break;

                case 'fast_forward':
                    // NOTE: Update to latest event ID - this is already the default behavior. This fires
                    // when the cursor is idle for too long (no relevant events, or events for scopes we don't
                    // have access to), preventing the old event ID from being garbage-collected server-side.
                    break;

                case 'tree_refresh':
                    Logger.info(
                        `${this.getUid()}: TreeRefresh, marking index populator as not done to request new indexing.`
                    );
                    await this.markAsNotDone(ctx.db);
                    ctx.enqueueOnce(new IndexPopulatorTask(this, false /* isBootstrap */));
                    // Return early to give a chance to the above task to be processed first.
                    // Remaining events will be processed in next incremental update.
                    return processed + 1;

                case 'tree_remove':
                    Logger.info(`${this.getUid()}: TreeRemove, scope cleanup needed`);
                    ctx.enqueueOnce(new RemoveTreeEventScopeIdTask(this.treeEventScopeId));
                    // Return early to give a chance to the above task to be processed first.
                    // Remaining events will be processed in next incremental update.
                    return processed + 1;

                case 'shared_with_me_updated':
                    // TODO: Shared volumes changed — may need to add/remove scope subscriptions.
                    // Not implemented yet but the idea will be:
                    //  - For additions: enqueue a new SharedWithMeIndexPopulator (make sure it fetch and compare new shared tree event scopes)
                    //  - For removals: enqueue a CleanUpTreeEventScopeIdTask
                    Logger.info(`${this.getUid()}: SharedWithMeUpdated`);
                    break;
            }

            processed++;
        }

        return processed;
    }

    async processNodeMutation(event: NodeEvent, ctx: TaskContext): Promise<void> {
        Logger.info(`${this.getUid()}: processNodeMutation ${event.type} for node ${event.nodeUid}`);
        const generation = await this.getGeneration(ctx.db);

        switch (event.type) {
            case 'node_created':
                await this.handleNodeCreated(event, ctx, generation);
                break;

            case 'node_updated':
                await this.handleNodeUpdated(event, ctx, generation);
                break;

            case 'node_deleted':
                await this.handleNodeDeleted(event, ctx);
                break;
        }
    }

    private async handleNodeCreated(
        event: Extract<NodeEvent, { isTrashed: boolean }>,
        ctx: TaskContext,
        generation: number
    ): Promise<void> {
        const maybeNode = await ctx.bridge.driveSdk.getNode(event.nodeUid);
        // getNodeEntity backfills undecryptable names with a placeholder,
        // so the node is always indexable even if the filename couldn't be decrypted.
        const { node } = getNodeEntity(maybeNode);
        this.maybeWarnForUndecryptableNodeName(maybeNode, event.nodeUid);

        const parentPathResult = await this.resolveParentPath(event.parentNodeUid, ctx);
        if (!parentPathResult.ok) {
            Logger.info(`${this.getUid()}: dropping node_created for ${event.nodeUid}, could not resolve parentPath`);
            throw parentPathResult.error;
        }

        const entry = this.createEntryForNode(node, parentPathResult.parentPath, generation);

        const { indexWriter } = await ctx.indexRegistry.get(this.indexKind, ctx.db);
        const session = indexWriter.startWriteSession();
        try {
            session.insert(entry);
            await session.commit();
        } catch (e) {
            session.dispose();
            throw new SearchLibraryError('Unable to create node', e);
        }
    }

    private async handleNodeUpdated(
        event: Extract<NodeEvent, { isTrashed: boolean }>,
        ctx: TaskContext,
        generation: number
    ): Promise<void> {
        const maybeNode = await ctx.bridge.driveSdk.getNode(event.nodeUid);
        const { node } = getNodeEntity(maybeNode);
        this.maybeWarnForUndecryptableNodeName(maybeNode, event.nodeUid);

        const parentPathResult = await this.resolveParentPath(event.parentNodeUid, ctx);
        if (!parentPathResult.ok) {
            Logger.info(`${this.getUid()}: dropping node_updated for ${event.nodeUid}, could not resolve parentPath`);
            throw parentPathResult.error;
        }

        const entry = this.createEntryForNode(node, parentPathResult.parentPath, generation);

        // Remove old entry + descendants, then insert the updated entry and
        // re-index the subtree (if folder) — all in a single write session.
        const { indexWriter, indexReader } = await ctx.indexRegistry.get(this.indexKind, ctx.db);

        // TODO: This might explode for gigantic folders with 100k of items since we accumulate them
        // in the session before commiting the whole write session. Consider adding some chunking here.
        const session = indexWriter.startWriteSession();
        try {
            session.remove(event.nodeUid);
            for await (const id of this.findIndexedDescendants(event.nodeUid, indexReader)) {
                session.remove(id);
            }
            session.insert(entry);

            // Re-index the entire subtree from SDK if this is a non-trashed folder.
            // Handles moved folders (stale paths) and un-trashed folders (descendants
            // weren't in the index). A trashed folder has no indexable descendants —
            // we keep the folder itself but stop there.
            // TODO(DRVWEB-5396): Classify diffs by whether they require a full descendant tree refresh.
            //  - Structural changes (untrashing, path changes) should trigger a full subtree refresh;
            //  - Non-structural updates (rename, revisions, etc.) should not.
            if (!event.isTrashed && node.type === NodeType.Folder) {
                const subtreeEntries = this.walkFolderTreeFromSdk(
                    event.nodeUid,
                    `${parentPathResult.parentPath}/${event.nodeUid}`,
                    ctx,
                    generation
                );
                for await (const subtreeEntry of subtreeEntries) {
                    session.insert(subtreeEntry);
                }
            }

            await session.commit();
        } catch (e) {
            session.dispose();
            throw new SearchLibraryError('Unable to update node and descendant tree', e);
        }
    }

    private async handleNodeDeleted(
        event: Extract<NodeEvent, { type: 'node_deleted' }>,
        ctx: TaskContext
    ): Promise<void> {
        await this.removeNodeAndDescendants(event.nodeUid, ctx);
    }

    /**
     * Remove a node and all its descendants from the index.
     * Descendants are found by matching entries whose path contains the nodeUid.
     */
    protected async removeNodeAndDescendants(nodeUid: string, ctx: TaskContext): Promise<void> {
        const { indexWriter, indexReader } = await ctx.indexRegistry.get(this.indexKind, ctx.db);

        const session = indexWriter.startWriteSession();
        let descendantCount = 0;
        try {
            session.remove(nodeUid);
            for await (const descendantId of this.findIndexedDescendants(nodeUid, indexReader)) {
                session.remove(descendantId);
                descendantCount++;
            }
            await session.commit();
        } catch (e) {
            session.dispose();
            throw new SearchLibraryError('Unable to remove node and descendant tree', e);
        }

        Logger.info(`${this.getUid()}: removed node ${nodeUid} and ${descendantCount} descendants`);
    }

    protected createEntryForNode(node: NodeEntity, parentPath: string, generation: number): IndexEntry {
        return createIndexEntry({
            node: toCoreNodeFields(node),
            treeEventScopeId: this.treeEventScopeId,
            parentPath,
            indexPopulatorId: this.indexPopulatorId,
            indexPopulatorVersion: this.version,
            indexPopulatorGeneration: generation,
        });
    }

    protected maybeWarnForUndecryptableNodeName(maybeNode: MaybeNode, nodeUid: string): void {
        const hasIndexableFilename = maybeNode.ok || (maybeNode.error.name && maybeNode.error.name.ok);
        if (!hasIndexableFilename) {
            Logger.warn(`${this.getUid()}: using fallback name for ${nodeUid}, no indexable filename`);
            // TODO: The name was not decryptable and a fallback name (⚠️ Undecryptable name) will be used, we
            // might want to add this node to a "repair name" service.
        }
    }

    /**
     * Find all descendant document IDs whose path contains /{nodeUid}.
     */
    private async *findIndexedDescendants(nodeUid: string, indexReader: IndexReader): AsyncIterableIterator<string> {
        const descendantExpr = Expression.attr(
            'path',
            Func.Matches,
            TermValue.wild()
                .then('/' + nodeUid)
                .wildcard()
        );
        for await (const result of indexReader.execute((q) => q.withStructuredExpression(descendantExpr))) {
            yield result.identifier;
        }
    }

    /**
     * BFS-walk a folder tree from the SDK, yielding an IndexEntry for each non-trashed node.
     */
    protected async *walkFolderTreeFromSdk(
        rootFolderUid: string,
        rootParentPath: string,
        ctx: TaskContext,
        generation: number
    ): AsyncIterableIterator<IndexEntry> {
        const queue: { folderUid: string; parentPath: string }[] = [
            { folderUid: rootFolderUid, parentPath: rootParentPath },
        ];

        while (queue.length > 0) {
            ctx.signal.throwIfAborted();

            const item = queue.shift();
            if (!item) {
                break;
            }

            // TODO: Check for AbortError here.
            // TODO: Catch thrown decryption errors and either:
            //         - mark them as needing to be repaired/preprocessed (e.g. when used during initial indexing)
            //         - (maybe) fail hard and retry all (when used during incremental update)
            const children = await ctx.bridge.driveSdk.iterateFolderChildren(item.folderUid);

            for (const child of children) {
                const { node } = getNodeEntity(child);
                this.maybeWarnForUndecryptableNodeName(child, node.uid);

                if (node.trashTime) {
                    Logger.warn('Unexpected trashed node found while visiting folders');

                    // Skip trashed nodes and descendants.
                    continue;
                }

                yield this.createEntryForNode(node, item.parentPath, generation);

                if (node.type === NodeType.Folder) {
                    queue.push({ folderUid: node.uid, parentPath: `${item.parentPath}/${node.uid}` });
                }
            }
        }
    }

    /**
     * Resolve the parentPath for a node given its parentNodeUid.
     * Tries the index first, then falls back to the SDK. Never throws — returns
     * a Result so callers can decide how to handle failures.
     */
    protected async resolveParentPath(
        parentNodeUid: string | undefined,
        ctx: TaskContext
    ): Promise<{ ok: true; parentPath: string } | { ok: false; error: unknown }> {
        if (!parentNodeUid) {
            return { ok: true, parentPath: '' };
        }

        try {
            const indexResult = await this.resolveParentPathFromIndex(parentNodeUid, ctx);
            if (indexResult.ok) {
                return indexResult;
            }

            const parentPath = await this.resolveParentPathFromSdk(parentNodeUid, ctx);
            return { ok: true, parentPath };
        } catch (error) {
            Logger.error(`${this.getUid()}: failed to resolve parentPath for parent ${parentNodeUid}`, error);
            return { ok: false, error };
        }
    }

    // TODO: Resolve parentPath by reading the parent's path attribute from the index.
    // This avoids SDK round-trips when the parent is already indexed.
    // Needs https://gitlab.protontech.ch/backend-team/foundation-team/search/-/merge_requests/364
    // to match path from the index and use it.
    private async resolveParentPathFromIndex(
        _parentNodeUid: string,
        _ctx: TaskContext
    ): Promise<{ ok: true; parentPath: string } | { ok: false }> {
        return { ok: false };
    }

    /**
     * Build the full ancestor-UID path by walking up the tree via the SDK.
     * Returns a path like "/grandparent-uid/parent-uid" for the given nodeUid,
     * or '' if the node is a direct child of the root.
     */
    private async resolveParentPathFromSdk(parentNodeUid: string, ctx: TaskContext): Promise<string> {
        const segments: string[] = [];
        let currentUid: string | undefined = parentNodeUid;

        while (currentUid) {
            const maybeNode = await ctx.bridge.driveSdk.getNode(currentUid);
            const { node } = getNodeEntity(maybeNode);

            // If the node has no parentUid it is the root — don't include it in the path.
            if (!node.parentUid) {
                break;
            }

            segments.unshift(currentUid);
            currentUid = node.parentUid;
        }

        return segments.length > 0 ? `/${segments.join('/')}` : '';
    }
}
