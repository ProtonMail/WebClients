import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Periodic maintenance: removes index entries from previous generations.
export class CleanUpStaleGenerationsTask extends BaseTask {
    getUid(): string {
        return 'task-CleanUpStaleGenerations';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        // TODO: Implement
        // After a TreeRefresh, a populator re-indexes all nodes with a bumped generation (e.g. 2).
        // The old entries (generation 1) are now stale — they may contain outdated data or reference
        // nodes that no longer exist. This task queries the WASM engine for entries where
        // `indexPopulatorGeneration < currentGeneration` and removes them.
    }
}
