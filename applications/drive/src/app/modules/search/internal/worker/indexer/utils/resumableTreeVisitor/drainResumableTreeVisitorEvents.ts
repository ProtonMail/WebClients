import type { NodeEntity } from '@proton/drive';

import type { IndexKind } from '../../../index/IndexRegistry';
import type { IndexEntry } from '../../indexEntry';
import type { TaskContext } from '../../tasks/BaseTask';
import { CleanUpStaleBlobsTask } from '../../tasks/CleanUpTasks/CleanUpStaleBlobsTask';
import type { BFSNodeEvent, BFSVisitorCheckpoint } from './ResumableFolderBFSVisitor';

// Commit the write session at least this often (in walked nodes). Bounds peak session memory and
// write amplification; also caps the work re-done after a crash.
export const COMMIT_EVERY_N_ENTRIES = 500;
// Advance the persisted resume checkpoint at most this many folder-expansions apart.
export const CHECKPOINT_EVERY_N_FOLDERS = 5;

export interface ResumableWalkHandlers {
    // Map a walked node to the index entry to write (populator-specific: identity, epoch, progress).
    toEntry: (node: NodeEntity, parentPath: string, generation: number) => IndexEntry;
    // Persist the resume checkpoint (+ any progress) — called after the drain has committed the
    // blobs up to it, so the checkpoint never leads the durable state.
    persistCheckpoint: (checkpoint: BFSVisitorCheckpoint) => Promise<void>;
}

/**
 * Shared chunked-commit + checkpoint drain, reused by both initial population and the incremental
 * subtree re-index. Consumes a ResumableFolderBFSVisitor's event stream directly: inserts an index
 * entry per walked node (mapped via `toEntry`), commits by node count (durability + bounded memory),
 * and advances the durable resume checkpoint (via `persistCheckpoint`) at folder boundaries. The
 * checkpoint can only lag the committed blobs, never lead them, so any crash window re-walks an
 * already-committed chunk idempotently (upsert by documentId).
 *
 * This does NOT own task-level concerns (subscription registration, markIndexing, markAsDone,
 * metrics) or the completion sweep — callers handle those.
 */
export async function drainResumableTreeVisitorEvents(
    events: AsyncIterableIterator<BFSNodeEvent>,
    indexKind: IndexKind,
    ctx: TaskContext,
    handlers: ResumableWalkHandlers
): Promise<void> {
    const { indexWriter } = await ctx.indexRegistry.get(indexKind, ctx.db);

    let session = indexWriter.startWriteSession();
    let pendingInserts = 0;
    let foldersSinceCheckpoint = 0;
    try {
        for await (const event of events) {
            ctx.signal.throwIfAborted();

            if (event.type === 'node') {
                session.insert(handlers.toEntry(event.node, event.parentPath, event.generation));
                ctx.notifyIndexingProgress();
                if (++pendingInserts >= COMMIT_EVERY_N_ENTRIES) {
                    await session.commit();
                    await new CleanUpStaleBlobsTask().execute(ctx);
                    session = indexWriter.startWriteSession();
                    pendingInserts = 0;
                }
                continue;
            }

            // Folder or mid-folder boundary: maybe persist a resume checkpoint.
            // Mid-folder boundaries are forced (commit every batch within a large
            // folder) but don't count as folder completions for CHECKPOINT_EVERY_N_FOLDERS.
            const isMidFolder = event.type === 'mid-folder-boundary';
            if (isMidFolder || ++foldersSinceCheckpoint >= CHECKPOINT_EVERY_N_FOLDERS) {
                if (pendingInserts > 0) {
                    // Blobs must be durable BEFORE the checkpoint advances past them.
                    await session.commit();
                    await new CleanUpStaleBlobsTask().execute(ctx);
                    session = indexWriter.startWriteSession();
                    pendingInserts = 0;
                }
                await handlers.persistCheckpoint(event.checkpoint);
                if (!isMidFolder) {
                    foldersSinceCheckpoint = 0;
                }
            }
        }

        if (pendingInserts > 0) {
            await session.commit();
            await new CleanUpStaleBlobsTask().execute(ctx);
        }
    } finally {
        // No-op after a successful commit (writer already released); releases the
        // write lock on any error/abort or for a trailing empty session.
        session.dispose();
    }
}
