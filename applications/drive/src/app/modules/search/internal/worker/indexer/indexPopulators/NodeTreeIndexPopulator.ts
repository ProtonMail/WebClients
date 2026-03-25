import { NodeType } from '@proton/drive';

import { getNodeEntity } from '../../../../../../utils/sdk/getNodeEntity';
import type { IndexEntry } from '../indexEntry';
import { createIndexEntry } from '../indexEntry';
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
        const queue: { folderUid: string; parentPath: string }[] = [{ folderUid: rootNodeUid, parentPath: '' }];

        while (queue.length > 0) {
            ctx.signal.throwIfAborted();

            const item = queue.shift();
            if (!item) {
                break;
            }

            const { folderUid, parentPath } = item;

            // TODO: Check for AbortError here.
            // TODO: Catch thrown decryption errors and mark node uids to be repaired
            // asynchronously.
            const children = await ctx.bridge.driveSdk.iterateFolderChildren(folderUid);

            for (const child of children) {
                const hasIndexableFilename = child.ok || (child.error.name && child.error.name.ok);
                if (!hasIndexableFilename) {
                    continue;

                    // TODO: Mark node with name issue to be repaired asynchronously later.
                }

                const { node } = getNodeEntity(child);

                if (node.trashTime) {
                    continue;
                }

                yield createIndexEntry({
                    node,
                    treeEventScopeId: this.treeEventScopeId,
                    parentPath,
                    indexPopulatorId: this.indexPopulatorId,
                    indexPopulatorVersion: this.version,
                    indexPopulatorGeneration: this.generation,
                });

                if (node.type === NodeType.Folder) {
                    queue.push({ folderUid: node.uid, parentPath: `${parentPath}/${node.uid}` });
                }
            }
        }
    }
}
