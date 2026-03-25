import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';
import { CLEANUP_TASKS } from '../CleanUpTasks/allCleanUpTasks';

const INTERVAL_MS = 60_000;

/**
 * Runs one cleanup task per cycle (round-robin), then self-schedules the next run.
 */
export class RecurringMaintenanceTask extends BaseTask {
    constructor(private readonly cleanupIndex: number = 0) {
        super();
    }

    getUid(): string {
        return 'task-Maintenance';
    }

    async execute(ctx: TaskContext): Promise<void> {
        Logger.info(`Running: ${this.getUid()}`);
        const Task = CLEANUP_TASKS[this.cleanupIndex % CLEANUP_TASKS.length];
        const task = new Task();
        await task.execute(ctx);

        // Self-schedule with round-robin advancement.
        ctx.enqueueDelayed(new RecurringMaintenanceTask(this.cleanupIndex + 1), INTERVAL_MS);
    }
}
