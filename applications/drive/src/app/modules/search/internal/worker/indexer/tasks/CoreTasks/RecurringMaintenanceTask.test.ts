import { makeTaskContext } from '../../../../testing/makeTaskContext';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';
import { RecurringMaintenanceTask } from './RecurringMaintenanceTask';

class FakeCleanUpTask extends BaseTask {
    static lastInstance: FakeCleanUpTask | null = null;
    executed = false;

    getUid() {
        return 'fake-cleanup';
    }

    async execute(_ctx: TaskContext) {
        this.executed = true;
        FakeCleanUpTask.lastInstance = this;
    }
}

class AnotherFakeCleanUpTask extends BaseTask {
    static lastInstance: AnotherFakeCleanUpTask | null = null;
    executed = false;

    getUid() {
        return 'another-fake-cleanup';
    }

    async execute(_ctx: TaskContext) {
        this.executed = true;
        AnotherFakeCleanUpTask.lastInstance = this;
    }
}

describe('RecurringMaintenanceTask', () => {
    const fakeTasks = [FakeCleanUpTask, AnotherFakeCleanUpTask] as const;

    beforeEach(() => {
        FakeCleanUpTask.lastInstance = null;
        AnotherFakeCleanUpTask.lastInstance = null;
    });

    it('executes the cleanup task at the current round-robin index', async () => {
        const ctx = makeTaskContext();

        await new RecurringMaintenanceTask(0, fakeTasks).execute(ctx);

        expect(FakeCleanUpTask.lastInstance?.executed).toBe(true);
        expect(AnotherFakeCleanUpTask.lastInstance).toBeNull();
    });

    it('self-schedules with incremented index', async () => {
        const ctx = makeTaskContext();

        await new RecurringMaintenanceTask(0, fakeTasks).execute(ctx);

        expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(RecurringMaintenanceTask), 60_000);
    });

    it('advances to the next task on subsequent execution', async () => {
        const ctx = makeTaskContext();

        await new RecurringMaintenanceTask(1, fakeTasks).execute(ctx);

        expect(FakeCleanUpTask.lastInstance).toBeNull();
        expect(AnotherFakeCleanUpTask.lastInstance?.executed).toBe(true);
    });

    it('cycles through tasks in round-robin order: 0 → 1 → 0 → 1', async () => {
        const executionOrder: string[] = [];
        FakeCleanUpTask.prototype.execute = async function () {
            executionOrder.push('task-0');
        };
        AnotherFakeCleanUpTask.prototype.execute = async function () {
            executionOrder.push('task-1');
        };

        let task: RecurringMaintenanceTask = new RecurringMaintenanceTask(0, fakeTasks);
        for (let i = 0; i < 4; i++) {
            const ctx = makeTaskContext();
            await task.execute(ctx);
            // Extract the next scheduled task from enqueueDelayed
            task = (ctx.enqueueDelayed as jest.Mock).mock.calls[0][0];
        }

        expect(executionOrder).toEqual(['task-0', 'task-1', 'task-0', 'task-1']);
    });
});
