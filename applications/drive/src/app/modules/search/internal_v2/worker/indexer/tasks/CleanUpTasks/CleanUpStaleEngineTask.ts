import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Periodic maintenance: disposes WASM engines and their persisted blobs that are no longer in the active engine set.
export class CleanUpStaleEngineTask extends BaseTask {
    getUid(): string {
        return 'task-CleanUpStaleEngine';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        // TODO: implement
        Logger.info(`Running: ${this.getUid()}`);
    }
}
