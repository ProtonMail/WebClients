import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';

class TaskPoller {
    private api: Api;

    private isMounted: () => boolean;

    private onTasksDone: () => void;

    private onTasksRunning: () => void;

    private timeoutDuration = 3000;

    constructor(params: { api: Api; isMounted: () => boolean; onTasksDone: () => void; onTasksRunning: () => void }) {
        this.api = params.api;
        this.onTasksDone = params.onTasksDone;
        this.onTasksRunning = params.onTasksRunning;
        this.isMounted = params.isMounted;
    }

    async start() {
        const isTaskRunning = await this.fetch();

        if (!this.isMounted()) {
            return;
        }

        if (isTaskRunning) {
            this.onTasksRunning();
            this.poll();
            return;
        }

        this.onTasksDone();
    }

    private async fetch(): Promise<boolean> {
        const result = await this.api<{ TasksRunning: Record<string, unknown> | null }>(
            queryMessageMetadata({
                LabelID: '0',
                Limit: 1,
                Page: 0,
                Sort: 'Time',
            } as any)
        );

        const tasksRunning = result?.TasksRunning ? Object.keys(result.TasksRunning) : [];

        return tasksRunning.length > 0;
    }

    private poll() {
        const pollCall = async () => {
            // Increase timeout duration after each call
            this.timeoutDuration += 3000;
            const isTaskRunning = await this.fetch();

            if (!this.isMounted()) {
                return;
            }

            if (isTaskRunning) {
                this.poll();
            } else {
                this.onTasksDone();
            }
        };

        window.setTimeout(() => {
            void pollCall();
        }, this.timeoutDuration);
    }
}

export default TaskPoller;
