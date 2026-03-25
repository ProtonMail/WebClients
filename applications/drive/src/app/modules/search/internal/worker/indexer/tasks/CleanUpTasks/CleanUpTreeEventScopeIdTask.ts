import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Periodic maintenance: scans for index entries belonging to obsolete tree event scopes and removes them.
export class CleanUpTreeEventScopeIdTask extends BaseTask {
    getUid(): string {
        return 'task-CleanUpTreeEventScopeId';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        // TODO: implement
    }
}
