import { Logger } from '../../../../shared/Logger';
import type { TreeEventScopeId } from '../../../../shared/types';
import type { IndexerTaskKind, TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Removes a single tree event scope (subscription, index entries, populator state) in response to a tree_remove event.
export class RemoveTreeEventScopeIdTask extends BaseTask {
    constructor(private readonly scopeId: TreeEventScopeId) {
        super();
    }

    getUid(): string {
        return this.getKind();
    }

    getKind(): IndexerTaskKind {
        return 'remove-tree-event-scope-id-task';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        // TODO: implement
        // 1. Unregister scope from TreeSubscriptionRegistry (disposes collector)
        // 2. Remove all index entries for this scope from the WASM engine
        // 3. Delete persisted subscription from DB
        // 4. Delete populator states for this scope from DB
        Logger.info(`${this.getUid()}: removing scope <${this.scopeId}> (not yet implemented)`);
    }
}
