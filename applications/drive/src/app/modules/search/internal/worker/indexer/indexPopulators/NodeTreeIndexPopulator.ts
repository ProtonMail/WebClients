import type { IndexEntry } from '../indexEntry';
import type { TaskContext } from '../tasks/BaseTask';
import { IndexPopulator } from './IndexPopulator';

/**
 * Populates the index by traversing a folder tree breadth-first from a root node.
 * Subclasses provide the root node UID to start from (My files root node, a device root node,
 * a shared-with-me folder, photos root node — only albums indexing will be particular).
 */
export abstract class NodeTreeIndexPopulator extends IndexPopulator {
    protected abstract getRootNodeUid(ctx: TaskContext): Promise<string>;

    async *visitAndProduceIndexEntries(ctx: TaskContext): AsyncIterableIterator<IndexEntry> {
        const rootNodeUid = await this.getRootNodeUid(ctx);
        yield* this.walkFolderTreeFromSdk(rootNodeUid, '', ctx);
    }
}
