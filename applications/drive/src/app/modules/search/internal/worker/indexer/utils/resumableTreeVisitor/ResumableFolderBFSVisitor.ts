import type { NodeEntity } from '@proton/drive';
import { NodeType } from '@proton/drive';

import type { DriveSdkBridgeInterface } from '../../../../mainThread/MainThreadBridge';
import { Logger } from '../../../../shared/Logger';
import type { SearchDB } from '../../../../shared/SearchDB';

export interface BFSVisitorState {
    id: string;
    queue: { folderUid: string; parentPath: string }[];
    generation: number;
    currentFolder?: {
        folderUid: string;
        parentPath: string;
        pendingUids: string[];
    };
    updatedAt: number;
    // Only set for type 'subtree-reindex' — pins the epoch and frozen path across resumes.
    // Absent for 'tree-initial-populate'.
    nodeUid?: string;
    parentPath?: string;
    epoch?: number;
}

export interface BFSVisitorCheckpoint {
    queue: { folderUid: string; parentPath: string }[];
    generation: number;
    currentFolder?: {
        folderUid: string;
        parentPath: string;
        pendingUids: string[];
    };
}

// Events yielded while visiting the tree of nodes.
export type BFSNodeEvent =
    | { type: 'node'; node: NodeEntity; parentPath: string; generation: number }
    | { type: 'folder-boundary'; checkpoint: BFSVisitorCheckpoint }
    | { type: 'mid-folder-boundary'; checkpoint: BFSVisitorCheckpoint };

export interface BFSVisitContext {
    db: SearchDB;
    driveSdk: Pick<DriveSdkBridgeInterface, 'iterateFolderChildrenNodeUids' | 'iterateNodes'>;
    signal: AbortSignal;
}

/**
 * Generic resumable BFS folder traversal backed by IndexedDB.
 *
 * Identified by a stable `id` (e.g. the populator UID for initial population, or a per-node id for
 * a subtree re-index). Each callsite that needs resumability creates an instance with that id; on
 * the next session it picks up from where it left off.
 *
 * Usage:
 *   const visitor = new ResumableFolderBFSVisitor('myfiles:scope-1');
 *   for await (const event of visitor.visit(startFolder, generation, ctx)) {
 *     if (event.type === 'node') { ... }
 *     else { await visitor.saveCheckpoint(ctx.db, event.checkpoint); }
 *   }
 *   await visitor.delete(ctx.db);
 */
/** Metadata carried only by 'subtree-reindex' visitors so a resumed re-index reuses the
 * same pinned epoch and frozen path (persisted verbatim on every checkpoint). */
export interface SubtreeReindexMetadata {
    nodeUid: string;
    parentPath: string;
    epoch: number;
}

export class ResumableFolderBFSVisitor {
    // Max number of items requested from the SDK per call.
    private static readonly SDK_BATCH_SIZE = 500;

    // Persisted verbatim on every checkpoint so a crash mid-walk never loses the info needed to
    // resume the subtree re-index (pinned epoch + frozen path). Undefined for 'tree-initial-populate'.
    private subtreeMetadata?: SubtreeReindexMetadata;

    constructor(public readonly id: string) {}

    /** Set the subtree metadata persisted alongside every checkpoint (pinned epoch + frozen path). */
    setSubtreeMetadata(metadata: SubtreeReindexMetadata): void {
        this.subtreeMetadata = metadata;
    }

    /** Read this visitor's persisted subtree metadata, or undefined if no marker exists yet. */
    async loadSubtreeMetadata(db: SearchDB): Promise<SubtreeReindexMetadata | undefined> {
        const state = await db.getBFSVisitorState(this.id);
        if (state?.epoch === undefined || state.nodeUid === undefined || state.parentPath === undefined) {
            return undefined;
        }
        return { nodeUid: state.nodeUid, parentPath: state.parentPath, epoch: state.epoch };
    }

    /** Read the generation pinned in this visitor's persisted checkpoint, or undefined if none. */
    async loadCheckpointGeneration(db: SearchDB): Promise<number | undefined> {
        const state = await db.getBFSVisitorState(this.id);
        return state?.generation;
    }

    private async loadCheckpoint(db: SearchDB): Promise<BFSVisitorCheckpoint | undefined> {
        const state = await db.getBFSVisitorState(this.id);
        if (!state) {
            return undefined;
        }
        return { queue: state.queue, generation: state.generation, currentFolder: state.currentFolder };
    }

    async saveCheckpoint(db: SearchDB, checkpoint: BFSVisitorCheckpoint): Promise<void> {
        const state: BFSVisitorState = {
            id: this.id,
            queue: checkpoint.queue,
            generation: checkpoint.generation,
            currentFolder: checkpoint.currentFolder,
            updatedAt: Date.now(),
            ...this.subtreeMetadata,
        };
        await db.putBFSVisitorState(state);
    }

    async delete(db: SearchDB): Promise<void> {
        await db.deleteBFSVisitorState(this.id);
    }

    /**
     * Run the BFS. If a checkpoint exists in the DB for this `id`, resumes from it
     * (ignoring `startFolder`). Otherwise starts fresh from `startFolder` using
     * `freshGeneration`.
     *
     * Emits:
     *   - `node`               per non-trashed child node
     *   - `mid-folder-boundary` after each batch of SDK_BATCH_SIZE nodes inside
     *                          a large folder (caller must commit + saveCheckpoint)
     *   - `folder-boundary`    after each folder is fully expanded (caller may commit
     *                          + saveCheckpoint)
     *
     * The generation baked into checkpoint events comes from the checkpoint (or
     * `freshGeneration` on a fresh start), ensuring all chunks of one scan share
     * the same generation even across crash-resumes.
     */
    async *visit(
        startFolder: { folderUid: string; parentPath: string },
        freshGeneration: number,
        ctx: BFSVisitContext
    ): AsyncIterableIterator<BFSNodeEvent> {
        const existing = await this.loadCheckpoint(ctx.db);
        const generation = existing?.generation ?? freshGeneration;
        const queue: { folderUid: string; parentPath: string }[] = existing ? [...existing.queue] : [startFolder];
        const currentFolder = existing?.currentFolder;

        if (currentFolder) {
            yield* this.processFolder(
                currentFolder.pendingUids,
                currentFolder.folderUid,
                currentFolder.parentPath,
                queue,
                generation,
                ctx
            );
        }

        while (queue.length > 0) {
            ctx.signal.throwIfAborted();
            const item = queue.shift();
            if (!item) {
                break;
            }

            const uids = await ctx.driveSdk.iterateFolderChildrenNodeUids(item.folderUid);
            uids.sort();

            yield* this.processFolder(uids, item.folderUid, item.parentPath, queue, generation, ctx);
        }
    }

    private async *processFolder(
        uids: string[],
        folderUid: string,
        parentPath: string,
        queue: { folderUid: string; parentPath: string }[],
        generation: number,
        ctx: BFSVisitContext
    ): AsyncIterableIterator<BFSNodeEvent> {
        let remaining = uids;

        while (remaining.length > 0) {
            ctx.signal.throwIfAborted();

            const batch = remaining.slice(0, ResumableFolderBFSVisitor.SDK_BATCH_SIZE);
            remaining = remaining.slice(ResumableFolderBFSVisitor.SDK_BATCH_SIZE);

            const nodes = await ctx.driveSdk.iterateNodes(batch);

            for (const node of nodes) {
                if (node.trashTime) {
                    Logger.warn('ResumableFolderBFSVisitor: unexpected trashed node, skipping');
                    continue;
                }
                yield { type: 'node', node, parentPath, generation };
                if (node.type === NodeType.Folder) {
                    queue.push({ folderUid: node.uid, parentPath: `${parentPath}/${node.uid}` });
                }
            }

            if (remaining.length > 0) {
                yield {
                    type: 'mid-folder-boundary',
                    checkpoint: {
                        queue: [...queue],
                        generation,
                        currentFolder: { folderUid, parentPath, pendingUids: remaining },
                    },
                };
            }
        }

        yield { type: 'folder-boundary', checkpoint: { queue: [...queue], generation } };
    }
}
