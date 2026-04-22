import { getNodeEntity } from '../../../../../../utils/sdk/getNodeEntity';
import type { TreeEventScopeId } from '../../../shared/types';
import { IndexKind } from '../../index/IndexRegistry';
import type { IndexEntry } from '../indexEntry';
import type { TaskContext } from '../tasks/BaseTask';
import { NodeTreeIndexPopulator } from './NodeTreeIndexPopulator';

const CURRENT_VERSION = 1;
const POPULATOR_ID = 'myfiles';

/**
 * Populates the index with My Files by BFS traversal from the root folder,
 * then adds trashed nodes to the index.
 */
export class MyFilesIndexPopulator extends NodeTreeIndexPopulator {
    constructor(treeEventScopeId: TreeEventScopeId) {
        super(treeEventScopeId, IndexKind.MAIN, POPULATOR_ID, CURRENT_VERSION);
    }

    protected async getRootNodeUid(ctx: TaskContext): Promise<string> {
        const maybeNode = await ctx.bridge.driveSdk.getMyFilesRootFolder();
        const { node } = getNodeEntity(maybeNode);
        return node.uid;
    }

    async *visitAndProduceIndexEntries(ctx: TaskContext): AsyncIterableIterator<IndexEntry> {
        yield* super.visitAndProduceIndexEntries(ctx);
        yield* this.walkTrashedNodesFromSdk(ctx);
    }

    // Trashed nodes are yielded with an empty parentPath — they're filtered out
    // of normal search via `trashTime > 0` and surfaced separately by the trash view.
    private async *walkTrashedNodesFromSdk(ctx: TaskContext): AsyncIterableIterator<IndexEntry> {
        const generation = await this.getGeneration(ctx.db);
        const trashedNodes = await ctx.bridge.driveSdk.iterateTrashedNodes();

        for (const maybeNode of trashedNodes) {
            ctx.signal.throwIfAborted();

            const { node } = getNodeEntity(maybeNode);
            this.maybeWarnForUndecryptableNodeName(maybeNode, node.uid);

            yield this.createEntryForNode(node, '', generation);
        }
    }
}
