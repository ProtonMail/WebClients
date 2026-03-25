import { getNodeEntity } from '../../../../../../utils/sdk/getNodeEntity';
import type { SearchDB } from '../../../shared/SearchDB';
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
    private constructor(treeEventScopeId: TreeEventScopeId, generation: number) {
        super(treeEventScopeId, IndexKind.MAIN, POPULATOR_ID, CURRENT_VERSION, generation);
    }

    static async create(treeEventScopeId: TreeEventScopeId, db: SearchDB): Promise<MyFilesIndexPopulator> {
        const state = await MyFilesIndexPopulator.loadOrCreateState(POPULATOR_ID, treeEventScopeId, db);
        return new MyFilesIndexPopulator(treeEventScopeId, state.generation);
    }

    protected async getRootNodeUid(ctx: TaskContext): Promise<string> {
        const maybeNode = await ctx.bridge.driveSdk.getMyFilesRootFolder();
        const { node } = getNodeEntity(maybeNode);
        return node.uid;
    }
}
