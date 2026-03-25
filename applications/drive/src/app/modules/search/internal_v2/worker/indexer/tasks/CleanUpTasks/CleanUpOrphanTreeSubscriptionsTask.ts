import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// TODO: Remove tree subscriptions that no longer have at least one index populator.
export class CleanUpOrphanTreeSubscriptionsTask extends BaseTask {
    getUid(): string {
        return 'task-CleanUpOrphanTreeSubscriptions';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        // TODO: implement
        Logger.info(`Running: ${this.getUid()}`);
    }
}
