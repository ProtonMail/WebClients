import type { ScheduleRun } from '@proton/lumo-api-client/core/desktop-schedules';

import { SchedulePersistenceError } from './types';
import type {
    ScheduleContext,
    ScheduleExecutionResult,
    ScheduleExecutionTarget,
    ScheduleExecutor,
    ScheduleOutcome,
    ScheduleRunRepository,
    ScheduleTask,
    ScheduleTaskSource,
} from './types';

type Options = {
    accountId: string;
    tasks: ScheduleTaskSource;
    repository: ScheduleRunRepository;
    runConversation: (
        target: ScheduleExecutionTarget,
        task: ScheduleTask,
        context: ScheduleContext,
        run: ScheduleRun
    ) => Promise<ScheduleExecutionResult>;
    isCurrentAccount: () => boolean;
    onComplete?: (task: ScheduleTask) => void | Promise<void>;
};

/** Executes fresh tasks through the existing web agent loop; never resumes unknown external effects. */
export class AgentScheduleExecutor implements ScheduleExecutor {
    constructor(private readonly options: Options) {}

    private guard(context: ScheduleContext): void {
        if (
            context.signal.aborted ||
            context.accountId !== this.options.accountId ||
            !this.options.isCurrentAccount()
        ) {
            throw new DOMException('Scheduled execution context expired', 'AbortError');
        }
    }

    async claim(run: ScheduleRun, context: ScheduleContext): Promise<boolean> {
        this.guard(context);
        const claimed = await this.options.repository.claim(run);
        this.guard(context);
        return claimed;
    }

    async execute(run: ScheduleRun, context: ScheduleContext): Promise<ScheduleOutcome> {
        this.guard(context);
        let outcome: ScheduleOutcome = 'interrupted';
        let messageIds: string[] = [];
        let completedTask: ScheduleTask | undefined;
        try {
            const task = await this.options.tasks.getTask(run, context);
            this.guard(context);
            if (
                !task ||
                task.id !== run.scheduleId ||
                task.timingRevision !== run.timingRevision ||
                !task.prompt.trim()
            ) {
                outcome = 'failed';
            } else {
                const target = await this.options.repository.startRun(run, task);
                messageIds = [target.assistant.id];
                this.guard(context);
                const result = await this.options.runConversation(target, task, context, run);
                this.guard(context);
                outcome = result.outcome;
                messageIds = result.messageIds;
                completedTask = task;
            }
        } catch (error) {
            if (error instanceof SchedulePersistenceError) throw error;
            this.guard(context);
            // Transport/tool failures may follow completed side effects. Never auto-retry.
            outcome = 'interrupted';
        }
        this.guard(context);
        const savedOutcome = await this.options.repository.finishRun({
            run,
            outcome,
            messageIds,
            finishedAt: new Date().toISOString(),
        });
        if (savedOutcome === 'succeeded' && completedTask?.notifyOnComplete) {
            this.guard(context);
            try {
                await this.options.onComplete?.(completedTask);
            } catch (error) {
                // A notification failure must not change a durably saved execution outcome.
                console.error('Could not show scheduled task completion notification', error);
            }
        }
        return savedOutcome;
    }

    async reconcile(run: ScheduleRun, context: ScheduleContext): Promise<ScheduleOutcome> {
        this.guard(context);
        const status = await this.options.repository.getStatus(run.runId);
        this.guard(context);
        if (status && status !== 'running') return status;
        return this.options.repository.interruptRun(run);
    }
}
