import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Periodic maintenance: removes index populator state left behind by previous indexer versions that are no longer active (checking by indexPopulatorId)
export class CleanUpStaleIndexPopulatorTask extends BaseTask {
    getUid(): string {
        return 'task-CleanUpStaleIndexPopulator';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        // TODO: implement
    }
}
