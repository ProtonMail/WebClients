import { getNodeEntity } from '../../../../../../utils/sdk/getNodeEntity';
import type { TreeEventScopeId } from '../../../shared/types';
import { IndexKind } from '../../index/IndexRegistry';
import type { TaskContext } from '../tasks/BaseTask';
import { NodeTreeIndexPopulator } from './NodeTreeIndexPopulator';

const CURRENT_VERSION = 1;
const POPULATOR_ID = 'myfiles';

/**
 * Populates the index with My Files by BFS traversal from the root folder.
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
}
