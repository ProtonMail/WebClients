import type { DownloadQueueTask, DownloadQueueTaskHandle } from './downloadTypes';

type DownloadSchedulerOptions = {
    maxConcurrentDownloads?: number;
};

type PendingTask = {
    id: string;
    task: DownloadQueueTask;
};

/**
 * This scheduler will be responsible to decide which file is downloaded next
 * the same instance of this scheduler needs to be used by both
 * - DownloadQueue: that handles individual downloads queued by the user
 * - ArchiveStreamGenerator: that streams the individual files part of an archive
 *
 * TODO: Right now this scheduler is extremely simple and downloads ALL files at the same time
 * next we will need to implement a smarter logic that considers how many blocks are left to download
 * and maximizes the bandwith at our disposal
 * see legacy: FILE_CHUNK_SIZE, MAX_DOWNLOADING_BLOCKS_LOAD, calculateDownloadBlockLoad
 */
export class DownloadScheduler {
    private readonly maxConcurrentDownloads: number;
    private readonly pendingTasks: PendingTask[] = [];
    private readonly activeTaskIds = new Set<string>();
    private readonly startingTaskIds = new Set<string>();
    private taskCounter = 0;

    constructor({ maxConcurrentDownloads = Number.POSITIVE_INFINITY }: DownloadSchedulerOptions = {}) {
        this.maxConcurrentDownloads = maxConcurrentDownloads;
    }

    scheduleDownload(task: DownloadQueueTask): string {
        const id = this.generateTaskId();
        this.pendingTasks.push({ id, task });
        this.drainQueue();
        return id;
    }

    cancelDownload(taskId: string): void {
        const index = this.pendingTasks.findIndex((entry) => entry.id === taskId);
        if (index >= 0) {
            this.pendingTasks.splice(index, 1);
        }

        if (this.startingTaskIds.delete(taskId)) {
            this.drainQueue();
        }
    }

    clearDownloads(): void {
        this.pendingTasks.length = 0;
        this.activeTaskIds.clear();
        this.startingTaskIds.clear();
    }

    private generateTaskId(): string {
        this.taskCounter += 1;
        return `download-task-${this.taskCounter}`;
    }

    private drainQueue(): void {
        while (this.activeTaskIds.size + this.startingTaskIds.size < this.maxConcurrentDownloads) {
            const nextEntry = this.pendingTasks.shift();
            if (!nextEntry) {
                return;
            }

            this.startTask(nextEntry);
        }
    }

    private startTask(entry: PendingTask): void {
        const { id, task } = entry;
        this.startingTaskIds.add(id);

        task.start()
            .then((handle: DownloadQueueTaskHandle) => {
                this.startingTaskIds.delete(id);
                this.activeTaskIds.add(id);

                handle.completion
                    .catch(() => undefined)
                    .finally(() => {
                        if (this.activeTaskIds.delete(id)) {
                            this.drainQueue();
                        }
                    });
            })
            .catch(() => {
                this.startingTaskIds.delete(id);
                this.activeTaskIds.delete(id);
                this.drainQueue();
            });
    }
}
