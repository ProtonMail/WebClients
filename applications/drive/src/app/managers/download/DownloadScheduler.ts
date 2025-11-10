import type { DownloadQueueTask, DownloadQueueTaskHandle } from './downloadTypes';

const ALLOWED_BYTES_PER_FILE = 40 * 1024 * 1024; // 40 MiB
const ALLOWED_BYTES_TOTAL_LOAD = 60 * 1024 * 1024; // 60 MiB
const MAX_CONCURRENT_FILE_DOWNLOADS = 15;
const UPDATE_PROGRESS_THROTTLE_MS = 1000;

type TaskLoad = {
    remainingBytes: number;
    totalBytes: number;
};

/**
 * DownloadScheduler mirrors the legacy queue behaviour:
 * - tasks start only while concurrent transfers stay under both size and file budget
 * - unknown-size downloads are allowed but block the queue until they (or their size) resolve
 * - ArchiveStreamGenerator shares the same scheduler so archive entries honour the same limits
 */
export class DownloadScheduler {
    private readonly pendingTasks: DownloadQueueTask[] = [];
    private readonly activeTasksLoad = new Map<string, TaskLoad>();
    private lastProgressUpdate = 0;
    private taskCounter = 0;

    // Enqueue a task and try to start it immediately if capacity allows.
    scheduleDownload(task: DownloadQueueTask): string {
        this.pendingTasks.push(task);
        this.drainQueue();
        return task.taskId;
    }

    // Remove a task from any queue state and free the load it reserved.
    cancelDownload(taskId: string): void {
        const index = this.pendingTasks.findIndex((task) => task.taskId === taskId);
        if (index >= 0) {
            this.pendingTasks.splice(index, 1);
        }

        if (this.activeTasksLoad.delete(taskId)) {
            this.drainQueue();
        }
    }

    // Reset the scheduler and drop any accounted load.
    clearDownloads(): void {
        this.pendingTasks.length = 0;
        this.activeTasksLoad.clear();
    }

    // Produce a unique identifier for each queued task.
    generateTaskId(): string {
        this.taskCounter += 1;
        return `download-task-${this.taskCounter}`;
    }

    // Updates the remaining bytes to download for the task, only happens once every second
    // At the end of the update we check the queue again to see if we now have allowance to start a new download
    updateDownloadProgress(taskId: string, downloadedBytes: number): void {
        if (Date.now() - this.lastProgressUpdate < UPDATE_PROGRESS_THROTTLE_MS) {
            return;
        }
        this.lastProgressUpdate = Date.now();
        const taskLoad = this.activeTasksLoad.get(taskId);
        if (!taskLoad) {
            return;
        }

        taskLoad.remainingBytes = Math.max(taskLoad.totalBytes - downloadedBytes, 0);
        this.activeTasksLoad.set(taskId, taskLoad);
        this.drainQueue();
    }

    // Promote pending tasks to active tasks IF their projected load fits.
    private drainQueue(): void {
        for (let index = 0; index < this.pendingTasks.length; index++) {
            const nextTask = this.pendingTasks[index];
            const estimatedBytes = this.getTaskLoad(nextTask);

            if (!this.canStartWithLoad(estimatedBytes)) {
                continue;
            }

            this.pendingTasks.splice(index, 1);
            const pendingTaskLoad = { totalBytes: estimatedBytes, remainingBytes: estimatedBytes };
            this.startTask(nextTask, pendingTaskLoad);
            break;
        }
    }

    // Transition a task into the starting state and attach teardown handlers.
    private startTask(task: DownloadQueueTask, pendingTaskLoad: TaskLoad): void {
        const id = task.taskId;
        this.activeTasksLoad.set(id, pendingTaskLoad);

        task.start()
            .then((handle: DownloadQueueTaskHandle) => {
                handle.completion
                    .catch(() => undefined)
                    .finally(() => {
                        this.activeTasksLoad.delete(id);
                        this.drainQueue();
                    });
            })
            .catch((error) => {
                this.activeTasksLoad.delete(id);
                this.drainQueue();
                throw error;
            });
    }

    // Sums all active downloads remaining sizes. Each remaining size is maxed out at ALLOWED_BYTES_PER_FILE
    // so it doesn't matter if a file is 100Gb, it can only occupy 40Mb of our max allocation.
    private getCurrentRemainingBytes() {
        let total = 0;
        for (const load of this.activeTasksLoad.values()) {
            total += Math.min(load.remainingBytes, ALLOWED_BYTES_PER_FILE);
        }
        return total;
    }

    // Detect whether any tracked task lacks a size estimate.
    // In that case we wait for the size to be populated (eg: traversing the archive)
    private hasUnknownLoad(): boolean {
        return [...this.activeTasksLoad.values()].some(({ remainingBytes }) => remainingBytes === undefined);
    }

    // Ensure the task's load fits within size and file budgets.
    // Returns true if the file we want to start fits into the allocated download budget
    private canStartWithLoad(estimatedBytes: number): boolean {
        const currentBytesLoad = this.getCurrentRemainingBytes();
        const cappedEstimate = Math.min(estimatedBytes, ALLOWED_BYTES_PER_FILE);

        if (this.activeTasksLoad.size >= MAX_CONCURRENT_FILE_DOWNLOADS) {
            return false;
        }

        if (this.hasUnknownLoad()) {
            return false;
        }

        return currentBytesLoad + cappedEstimate <= ALLOWED_BYTES_TOTAL_LOAD;
    }

    // Estimate how much load a task will add once it starts.
    private getTaskLoad(task: DownloadQueueTask): number {
        task.storageSizeEstimate = task.storageSizeEstimate ?? task.node.storageSize ?? 0;

        return task.storageSizeEstimate;
    }
}
