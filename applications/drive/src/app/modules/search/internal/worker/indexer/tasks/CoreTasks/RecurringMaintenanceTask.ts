import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';
import { CLEANUP_TASKS } from '../CleanUpTasks/allCleanUpTasks';

const INTERVAL_MS = 60_000;

/**
 * Runs one cleanup task per cycle (round-robin), then self-schedules the next run.
 */
type CleanUpTaskConstructor = new () => BaseTask;

export class RecurringMaintenanceTask extends BaseTask {
    constructor(
        private readonly cleanupIndex: number = 0,
        private readonly tasks: readonly CleanUpTaskConstructor[] = CLEANUP_TASKS
    ) {
        super();
    }

    getUid(): string {
        return 'task-Maintenance';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        const Task = this.tasks[this.cleanupIndex];
        const task = new Task();
        await task.execute(ctx);

        // Self-schedule with round-robin advancement.
        const nextCleanupIndex = (this.cleanupIndex + 1) % this.tasks.length;
        ctx.enqueueDelayed(new RecurringMaintenanceTask(nextCleanupIndex, this.tasks), INTERVAL_MS);
    }
}
