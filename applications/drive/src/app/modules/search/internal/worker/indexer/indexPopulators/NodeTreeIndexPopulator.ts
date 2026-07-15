import type { DriveEvent, NodeEvent } from '@protontech/drive-sdk';

import type { NodeEntity } from '@proton/drive';
import { NodeType } from '@proton/drive';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import { Logger } from '../../../shared/Logger';
import type { SearchDB } from '../../../shared/SearchDB';
import { SearchLibraryError } from '../../../shared/errors';
import type { TreeEventScopeId } from '../../../shared/types';
import type { IndexReader } from '../../index/IndexReader';
import type { IndexKind } from '../../index/IndexRegistry';
import type { IndexEntry } from '../indexEntry';
import { createIndexEntry, toCoreNodeFields } from '../indexEntry';
import { removeTreeEventScope } from '../removeTreeEventScope';
import type { TaskContext } from '../tasks/BaseTask';
import { CleanUpStaleIndexEntryTask } from '../tasks/CleanUpTasks/CleanUpStaleIndexEntryTask';
import { IndexPopulatorTask } from '../tasks/CoreTasks/IndexPopulatorTask';
import { ResumableFolderBFSVisitor } from '../utils/resumableTreeVisitor/ResumableFolderBFSVisitor';
import { drainResumableTreeVisitorEvents } from '../utils/resumableTreeVisitor/drainResumableTreeVisitorEvents';
import { IndexPopulator } from './IndexPopulator';

// Prefix for a subtree re-index visitor/marker id (see subtreeVisitorId).
const SUBTREE_VISITOR_TYPE = 'subtree-reindex';

/**
 * Populates and maintains a search index from a Drive folder tree, walking breadth-first from a
 * root node. Subclasses provide the root node UID to start from (My files root node, a device root
 * node, a shared-with-me folder, ...).
 *
 * This layer owns everything about Drive nodes, trees, and traversal: initial folder-tree walking,
 * incremental change handling (create/update/delete events), node → index-entry mapping,
 * parent-path resolution, indexed-descendant queries, and the resumable subtree re-index (with its
 * epoch-based obsolete-descendant sweep). The base IndexPopulator stays agnostic of all of it.
 */
export abstract class NodeTreeIndexPopulator extends IndexPopulator {
    protected abstract getRootNodeUid(ctx: TaskContext): Promise<string>;

    // Stable id for this populator's initial full-tree walk visitor/marker.
    static initialVisitorId(populatorUid: string): string {
        return `tree-visitor-initial-${populatorUid}`;
    }

    // Stable id for a subtree re-index visitor/marker, unique per (index, scope, node).
    static subtreeVisitorId(indexKind: IndexKind, treeEventScopeId: TreeEventScopeId, nodeUid: string): string {
        return `${SUBTREE_VISITOR_TYPE}:${indexKind}:${treeEventScopeId}:${nodeUid}`;
    }

    private getVisitor(): ResumableFolderBFSVisitor {
        return new ResumableFolderBFSVisitor(NodeTreeIndexPopulator.initialVisitorId(this.getUid()));
    }

    async markAsDone(db: SearchDB): Promise<void> {
        await super.markAsDone(db);
        await this.getVisitor().delete(db);
    }

    async markAsNotDone(db: SearchDB): Promise<void> {
        await this.getVisitor().delete(db);
        await super.markAsNotDone(db);
    }

    /**
     * Initial population: walk the whole tree from the root and mark the populator done on success.
     * Restores any progress persisted by a prior (interrupted) run so the bar doesn't reset on resume.
     */
    async populate(ctx: TaskContext): Promise<void> {
        await this.restoreProgressFromDB(ctx.db);
        await this.runResumableFolderIndexing(ctx, {
            visitor: this.getVisitor(),
            startFolder: { folderUid: await this.getRootNodeUid(ctx), parentPath: '' },
            epoch: 0,
            finalize: () => this.markAsDone(ctx.db),
        });
    }

    /**
     * Flattened view of the initial-population walk that yields only index entries.
     * Convenience for non-resumable callers and tests.
     */
    async *visitAndProduceIndexEntries(ctx: TaskContext): AsyncIterableIterator<IndexEntry> {
        const generation = await this.getGeneration(ctx.db);
        const rootUid = await this.getRootNodeUid(ctx);
        const events = this.getVisitor().visit({ folderUid: rootUid, parentPath: '' }, generation, {
            db: ctx.db,
            driveSdk: ctx.bridge.driveSdk,
            signal: ctx.signal,
        });
        for await (const event of events) {
            if (event.type === 'node') {
                yield this.createEntryForNode(event.node, event.parentPath, event.generation);
            }
        }
    }

    /**
     * The one resumable folder-indexing pass, shared by initial population and subtree re-index.
     * Walks the folder tree from `startFolder` (resuming from the visitor's checkpoint if present)
     * and drives the visitor's events straight through the chunked drain. The two callers differ
     * only in the options: initial population uses the whole-tree visitor, `epoch: 0`, and a
     * markAsDone finalize; subtree re-index uses a scoped visitor, a pinned `epoch`, and a
     * sweep + delete-marker finalize. `finalize` only runs on success (the drain throws on abort).
     */
    private async runResumableFolderIndexing(
        ctx: TaskContext,
        options: {
            visitor: ResumableFolderBFSVisitor;
            startFolder: { folderUid: string; parentPath: string };
            epoch: number;
            finalize: () => Promise<void>;
        }
    ): Promise<void> {
        const generation = await this.getGeneration(ctx.db);
        const events = options.visitor.visit(options.startFolder, generation, {
            db: ctx.db,
            driveSdk: ctx.bridge.driveSdk,
            signal: ctx.signal,
        });
        await drainResumableTreeVisitorEvents(events, this.indexKind, ctx, {
            toEntry: (node, parentPath, entryGeneration) =>
                this.createEntryForNode(node, parentPath, entryGeneration, options.epoch),
            persistCheckpoint: async (checkpoint) => {
                await options.visitor.saveCheckpoint(ctx.db, checkpoint);
                await this.saveProgress(ctx.db);
            },
        });
        await options.finalize();
    }

    // =========================================================================
    // Incremental updates
    // =========================================================================

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
                    // A folder update re-indexes its subtree inline (see handleNodeUpdated), so the
                    // batch continues in order — no deferral needed.
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
                    ctx.enqueueOnce(new IndexPopulatorTask(this));
                    // Re-index will bump the generation; entries from the previous
                    // generation that aren't revisited become stale.
                    ctx.enqueueOnce(new CleanUpStaleIndexEntryTask());
                    // Return early to give a chance to the above task to be processed first.
                    // Remaining events will be processed in next incremental update.
                    return processed + 1;

                case 'tree_remove':
                    Logger.info(`${this.getUid()}: TreeRemove, tearing down scope <${this.treeEventScopeId}>`);

                    // Stop tracking the tree event scope id everywhere. Deleting
                    // its populator state orphans the scope's index entries.
                    await removeTreeEventScope(this.treeEventScopeId, ctx);

                    // Remove any orphan index entries that are attached to the obsolete tree event scope id.
                    ctx.enqueueOnce(new CleanUpStaleIndexEntryTask());

                    // Do NOT count tree_remove as processed: leaving it uncommitted keeps the event cursor
                    // before it, so the teardown is retried (reschedule + reload redelivery) if any step
                    // above threw. On success unregisterByScope disposed the collector, so the event won't
                    // be reprocessed.
                    return processed;

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
        this.maybeWarnForUndecryptableNodeName(maybeNode, event.nodeUid);

        const parentPathResult = await this.resolveParentPath(event.parentNodeUid, ctx);
        if (!parentPathResult.ok) {
            Logger.info(`${this.getUid()}: dropping node_created for ${event.nodeUid}, could not resolve parentPath`);
            throw parentPathResult.error;
        }

        const entry = this.createEntryForNode(maybeNode, parentPathResult.parentPath, generation);
        await this.upsertNode(entry, ctx);
    }

    private async handleNodeUpdated(
        event: Extract<NodeEvent, { isTrashed: boolean }>,
        ctx: TaskContext,
        generation: number
    ): Promise<void> {
        const maybeNode = await ctx.bridge.driveSdk.getNode(event.nodeUid);
        this.maybeWarnForUndecryptableNodeName(maybeNode, event.nodeUid);

        const parentPathResult = await this.resolveParentPath(event.parentNodeUid, ctx);
        if (!parentPathResult.ok) {
            Logger.info(`${this.getUid()}: dropping node_updated for ${event.nodeUid}, could not resolve parentPath`);
            throw parentPathResult.error;
        }

        // A non-trashed folder may have had children added/removed with no per-child events
        // (the backend only sends the top folder event), so its whole subtree is re-scanned
        // below via a resumable inline walk.
        // TODO(DRVWEB-5396): this re-walks the whole subtree for EVERY folder update, including
        // ones that cannot have changed descendants (rename, share toggle, revision/metadata -
        // descendant paths are UID-based, so a rename never affects them). Classify the diff and
        // only re-walk when it's structural (moved, or child set changed); skip otherwise.
        const willReindexSubtree = !event.isTrashed && maybeNode.type === NodeType.Folder;

        // Remove the node, and for a trashed folder its now-stale descendant subtree. A non-trashed
        // folder's descendants are handled by the subtree re-index below (kept searchable meanwhile);
        // files never have descendants, so nothing extra to remove there.
        const deleteDescendants = !willReindexSubtree && maybeNode.type === NodeType.Folder;
        await this.removeNodeAndDescendants(event.nodeUid, ctx, deleteDescendants);

        // Re-insert the node's own updated entry. The subtree walk below only writes descendants,
        // so the anchor (the node itself) must always be upserted here.
        const entry = this.createEntryForNode(maybeNode, parentPathResult.parentPath, generation);
        await this.upsertNode(entry, ctx);

        if (willReindexSubtree) {
            // A non-trashed folder: also re-index its subtree (adds new children, sweeps obsolete).
            const subtreeParentPath = `${parentPathResult.parentPath}/${event.nodeUid}`;
            await this.reindexSubtree(event.nodeUid, subtreeParentPath, ctx);
        }
    }

    private async handleNodeDeleted(
        event: Extract<NodeEvent, { type: 'node_deleted' }>,
        ctx: TaskContext
    ): Promise<void> {
        await this.removeNodeAndDescendants(event.nodeUid, ctx, true /* deleteDescendants */);
    }

    /**
     * Remove a node from the index, and (when `deleteDescendants`) its whole descendant subtree.
     * Descendants are found by matching entries whose path contains the nodeUid.
     */
    protected async removeNodeAndDescendants(
        nodeUid: string,
        ctx: TaskContext,
        deleteDescendants: boolean
    ): Promise<void> {
        const { indexWriter, indexReader } = await ctx.indexRegistry.get(this.indexKind, ctx.db);

        const session = indexWriter.startWriteSession();
        let descendantCount = 0;
        try {
            session.remove(nodeUid);
            if (deleteDescendants) {
                for await (const descendantId of this.findIndexedDescendants(nodeUid, indexReader)) {
                    session.remove(descendantId);
                    descendantCount++;
                }
            }
            await session.commit();
        } catch (e) {
            session.dispose();
            throw new SearchLibraryError('Unable to remove node and descendant tree', e);
        }

        Logger.info(`${this.getUid()}: removed node ${nodeUid} and ${descendantCount} descendants`);
    }

    /**
     * Insert (upsert by documentId) a single node's index entry in its own committed session.
     */
    private async upsertNode(entry: IndexEntry, ctx: TaskContext): Promise<void> {
        const { indexWriter } = await ctx.indexRegistry.get(this.indexKind, ctx.db);
        const session = indexWriter.startWriteSession();
        try {
            session.insert(entry);
            await session.commit();
        } catch (e) {
            session.dispose();
            throw new SearchLibraryError('Unable to upsert node', e);
        }
    }

    // =========================================================================
    // Resumable subtree re-index (incremental)
    // =========================================================================

    /**
     * Resumable, chunked re-index of a folder's subtree, run inline during incremental update.
     *
     * ADD: re-walk the folder from the SDK and upsert each node, stamping this run's epoch.
     * DELETE: sweep descendants left at an older epoch (not re-walked) — the backend sends no
     * per-child events, so the epoch is the only signal for obsolete descendants.
     *
     * Crash-safety without a separate task or bootstrap recovery: the walk runs synchronously
     * within event processing, so the incremental cursor can only advance once it completes.
     * A crash mid-walk therefore leaves the triggering event uncommitted; on reconnect the SDK
     * re-delivers it, this runs again, and the visitor resumes from its persisted checkpoint.
     *
     * The epoch and resolved path are pinned in the durable marker on the first run and reused on
     * resume (a fresh epoch on resume would make the sweep delete freshly-written entries; a
     * re-resolved path could drift if the folder moved again between crash and restart).
     */
    protected async reindexSubtree(nodeUid: string, subtreeParentPath: string, ctx: TaskContext): Promise<void> {
        const visitorId = NodeTreeIndexPopulator.subtreeVisitorId(this.indexKind, this.treeEventScopeId, nodeUid);
        const visitor = new ResumableFolderBFSVisitor(visitorId);
        const generation = await this.getGeneration(ctx.db);

        // A subtree marker that survived a generation bump is stale and must not be resumed. A
        // tree_refresh resets the populator via markAsNotDone, which only deletes the initial-walk
        // marker; an in-flight subtree marker (from a re-index that crashed mid-walk) outlives it.
        // Resuming it would replay a checkpoint frozen at the previous generation and reuse its
        // pinned epoch, so the obsolete-descendant sweep (reindexEpoch < pinned epoch) would delete
        // the entries the fresh re-population just wrote at epoch 0. Discard it and start fresh.
        const checkpointGeneration = await visitor.loadCheckpointGeneration(ctx.db);
        if (checkpointGeneration !== undefined && checkpointGeneration < generation) {
            Logger.info(
                `${this.getUid()}: discarding stale subtree marker for ${nodeUid} (generation ${checkpointGeneration} < ${generation})`
            );
            await visitor.delete(ctx.db);
        }

        // The subtree-specific options: resume reuses the pinned epoch + frozen path; a fresh run
        // allocates a new epoch. It gets pinned into the marker on the first checkpoint via the
        // metadata set here. All marker I/O goes through the visitor.
        const existing = await visitor.loadSubtreeMetadata(ctx.db);
        const epoch = existing?.epoch ?? (await this.allocateSubtreeReindexEpoch(ctx.db));
        const parentPath = existing?.parentPath ?? subtreeParentPath;
        visitor.setSubtreeMetadata({ nodeUid, parentPath, epoch });

        await this.runResumableFolderIndexing(ctx, {
            visitor,
            startFolder: { folderUid: nodeUid, parentPath },
            epoch,
            finalize: async () => {
                // DELETE: sweep descendants not re-stamped this run, then drop the marker.
                await this.sweepObsoleteDescendants(nodeUid, epoch, ctx);
                await visitor.delete(ctx.db);
            },
        });
    }

    /**
     * Allocate the next subtree-reindex epoch for this populator (monotonic). Each subtree re-index
     * run gets a fresh epoch; entries it writes are stamped with it, and its deferred sweep deletes
     * descendants left at an older epoch (not re-walked).
     */
    private async allocateSubtreeReindexEpoch(db: SearchDB): Promise<number> {
        const state = await this.ensureState(db);
        const epoch = (state.subtreeReindexEpoch ?? 0) + 1;
        await db.putPopulatorState({ ...state, subtreeReindexEpoch: epoch });
        return epoch;
    }

    /**
     * Deferred GC for a resumable subtree re-index. Removes descendants of `nodeUid` (path contains
     * /{nodeUid}) that were NOT re-stamped by this run — i.e. entries whose reindexEpoch is below the
     * run's epoch. Those are exactly the descendants the SDK no longer reports (removed in a bulk
     * folder change, moved out, etc.); the backend sends no per-child events, so the epoch is the
     * only signal.
     */
    private async sweepObsoleteDescendants(nodeUid: string, epoch: number, ctx: TaskContext): Promise<void> {
        const { indexWriter, indexReader } = await ctx.indexRegistry.get(this.indexKind, ctx.db);

        const staleExpr = this.descendantsPathExpr(nodeUid).and(
            Expression.attr('reindexEpoch', Func.LessThan, TermValue.int(BigInt(epoch)))
        );

        // Collect all stale uids first.
        const staleIds: string[] = [];
        for await (const result of indexReader.execute((q) => q.withStructuredExpression(staleExpr))) {
            staleIds.push(result.identifier);
        }

        if (staleIds.length === 0) {
            return;
        }

        // Then remove them.
        const session = indexWriter.startWriteSession();
        try {
            for (const id of staleIds) {
                session.remove(id);
            }
            await session.commit();
        } catch (e) {
            session.dispose();
            throw new SearchLibraryError('Unable to sweep obsolete descendants', e);
        }

        Logger.info(`${this.getUid()}: swept ${staleIds.length} obsolete descendants under ${nodeUid}`);
    }

    // =========================================================================
    // Node → entry mapping
    // =========================================================================

    protected createEntryForNode(
        node: NodeEntity,
        parentPath: string,
        generation: number,
        reindexEpoch = 0
    ): IndexEntry {
        this.trackNodeIndexed(node.type);
        return createIndexEntry({
            node: toCoreNodeFields(node),
            treeEventScopeId: this.treeEventScopeId,
            parentPath,
            indexPopulatorKind: this.indexPopulatorKind,
            indexPopulatorVersion: this.version,
            indexPopulatorGeneration: generation,
            reindexEpoch,
        });
    }

    private trackNodeIndexed(nodeType: NodeType): void {
        switch (nodeType) {
            case NodeType.File:
                this.progress.files++;
                break;
            case NodeType.Folder:
                this.progress.folders++;
                break;
            case NodeType.Album:
                this.progress.albums++;
                break;
            case NodeType.Photo:
                this.progress.photos++;
                break;
        }
    }

    protected maybeWarnForUndecryptableNodeName(node: NodeEntity, nodeUid: string): void {
        if (!node.name.ok) {
            Logger.warn(`${this.getUid()}: using fallback name for ${nodeUid}, no indexable filename`);
            // TODO: The name was not decryptable and a fallback name (⚠️ Undecryptable name) will be used, we
            // might want to add this node to a "repair name" service.
        }
    }

    /** Structured expression matching every descendant of `nodeUid` (its uid appears in their path). */
    private descendantsPathExpr(nodeUid: string): Expression {
        return Expression.attr(
            'path',
            Func.Matches,
            TermValue.wild()
                .then('/' + nodeUid)
                .wildcard()
        );
    }

    /**
     * Find all descendant document IDs whose path contains /{nodeUid}.
     */
    private async *findIndexedDescendants(nodeUid: string, indexReader: IndexReader): AsyncIterableIterator<string> {
        const descendantExpr = this.descendantsPathExpr(nodeUid);
        for await (const result of indexReader.execute((q) => q.withStructuredExpression(descendantExpr))) {
            yield result.identifier;
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
     *
     * TODO: Rewrite using hierachy methods from SDK.
     */
    private async resolveParentPathFromSdk(parentNodeUid: string, ctx: TaskContext): Promise<string> {
        const segments: string[] = [];
        let currentUid: string | undefined = parentNodeUid;

        while (currentUid) {
            const maybeNode = await ctx.bridge.driveSdk.getNode(currentUid);

            // If the node has no parentUid it is the root — don't include it in the path.
            if (!maybeNode.parentUid) {
                break;
            }

            segments.unshift(currentUid);
            currentUid = maybeNode.parentUid;
        }

        return segments.length > 0 ? `/${segments.join('/')}` : '';
    }
}
