import type { NodeEntity } from '@proton/drive/index';
import { NodeType } from '@proton/drive/index';

import type { DownloadController } from './DownloadManager';
import type { ArchiveItem, ArchiveTracker, DownloadQueueTask, DownloadScheduler } from './downloadTypes';
import { createAsyncQueue } from './utils/asyncQueue';
import { getDownloadSdk } from './utils/getDownloadSdk';
import { getNodeStorageSize } from './utils/getNodeStorageSize';
import { getNodeModifiedTime } from './utils/nodeHelpers';

export type { ArchiveItem, ArchiveTracker } from './downloadTypes';

/**
 * Called to start the creation of a new archive
 * will keep track of the individual files being downloaded while they are scheduled
 * it's a sort of orchestrator object
 */
const createArchiveTracker = (onProgress: (downloadedBytes: number, claimedSize: number) => void): ArchiveTracker => {
    // Each file of the archive records its own downloaded bytes
    const downloadedBytesMap: Record<string, number> = {};
    const controllerByUid = new Map<string, DownloadController>();
    const completionPromises = new Map<string, Promise<void>>();
    let firstItemSettled = false;
    let resolveFirstItem: () => void;
    let rejectFirstItem: (error: unknown) => void;
    const firstItemPromise = new Promise<void>((resolve, reject) => {
        resolveFirstItem = resolve;
        rejectFirstItem = reject;
    });

    return {
        registerFile(taskId: string) {
            downloadedBytesMap[taskId] = 0;
        },
        updateDownloadProgress(taskId: string, downloadedBytes: number, claimedSize: number) {
            downloadedBytesMap[taskId] = downloadedBytes;
            const inFlightBytes = Object.values(downloadedBytesMap).reduce((acc, val) => acc + val, 0);
            onProgress(inFlightBytes, claimedSize);
        },
        attachController(taskId: string, controller: DownloadController) {
            controllerByUid.set(taskId, controller);

            const completionPromise = controller.completion().finally(() => {
                completionPromises.delete(taskId);
                controllerByUid.delete(taskId);
            });

            completionPromises.set(taskId, completionPromise);
        },
        // individual task completion
        waitForTaskCompletion(taskId: string): Promise<void> {
            const completion = completionPromises.get(taskId);
            if (completion) {
                return completion;
            }
            return Promise.resolve();
        },
        pauseAll() {
            controllerByUid.forEach((ctrl) => ctrl.pause());
        },
        resumeAll() {
            controllerByUid.forEach((ctrl) => ctrl.resume());
        },
        waitForCompletion(): Promise<void> {
            const pendingCompletions = [...completionPromises.values()];
            if (!pendingCompletions.length) {
                return Promise.resolve();
            }
            // Only return ONCE when all archive files have finished download
            return Promise.all(pendingCompletions).then(() => {});
        },
        notifyItemReady() {
            if (!firstItemSettled) {
                firstItemSettled = true;
                resolveFirstItem();
            }
        },
        notifyError(error: unknown) {
            if (!firstItemSettled) {
                firstItemSettled = true;
                rejectFirstItem(error);
            }
        },
        waitForFirstItem(): Promise<void> {
            if (firstItemSettled) {
                return Promise.resolve();
            }
            return firstItemPromise;
        },
    };
};

/**
 * Instantiates an ArchiveTracker and uses the shared scheduler to start downloading the archive files individually.
 * All the logic related to when and why files start downloading must be kept inside the Scheduler.
 */
export class ArchiveStreamGenerator {
    private readonly tracker: ArchiveTracker;
    // Queue of the items that have started actively downloading
    private readonly archiveItemsQueue = createAsyncQueue<ArchiveItem>();
    private pendingArchiveTasks = 0;
    private schedulingCompleted = false;
    private scheduledTasksAwaitingStart = 0;
    private hasProducedItem = false;
    private totalClaimedSize = 0;

    readonly generator: AsyncGenerator<ArchiveItem>;
    readonly controller: DownloadController;

    constructor(
        private readonly entries: AsyncIterable<NodeEntity>,
        onProgress: (downloadedBytes: number, claimedSize: number) => void,
        private readonly scheduler: DownloadScheduler,
        private readonly abortSignal: AbortSignal,
        private readonly parentPathByUid: Map<string, string[]>,
        private readonly downloadId: string
    ) {
        this.tracker = createArchiveTracker(onProgress);
        this.generator = this.createGenerator();
        this.controller = {
            pause: () => this.tracker.pauseAll(),
            resume: () => this.tracker.resumeAll(),
            completion: () => this.tracker.waitForCompletion(),
        };

        this.abortSignal.addEventListener('abort', () => {
            const abortError = new Error('Archive download aborted');
            this.tracker.notifyError(abortError);
            this.archiveItemsQueue.error(abortError);
        });

        void this.scheduleEntries();
    }

    /**
     * createArchiveItem sets things up: it registers the file, kicks off downloader.writeToStream,
     * and returns the ArchiveItem.
     * It does not wait for the network transfer to finish.
     */
    private async createArchiveItem(taskId: string, node: NodeEntity, parentPath: string[]): Promise<ArchiveItem> {
        if (node.type !== NodeType.File) {
            return {
                isFile: false,
                name: node.name,
                parentPath,
            };
        }

        const drive = getDownloadSdk(this.downloadId);
        const downloader = await drive.getFileDownloader(node.uid, this.abortSignal);
        const claimedSize = downloader.getClaimedSizeInBytes();

        const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>>();
        this.tracker.registerFile(taskId);

        const controller = downloader.downloadToStream(writable, (downloadedBytes) => {
            this.tracker.updateDownloadProgress(taskId, downloadedBytes, this.totalClaimedSize);
            this.scheduler.updateDownloadProgress(taskId, downloadedBytes);
        });

        this.tracker.attachController(taskId, controller);

        return {
            isFile: true,
            name: node.name,
            parentPath,
            stream: readable,
            fileModifyTime: getNodeModifiedTime(node),
            claimedSize,
        };
    }

    /**
     * This generator yields prepared ArchiveItem files,
     * their download has started but has not necessarily finished,
     * this generator will finish yelding once all archive files have been fully downloaded.
     */
    private createGenerator(): AsyncGenerator<ArchiveItem> {
        const queueIterator = this.archiveItemsQueue.iterator();
        const tracker = this.tracker;

        return (async function* generate() {
            for await (const item of queueIterator) {
                yield item;
            }

            await tracker.waitForCompletion();
        })();
    }

    private insertArchiveEntryInScheduler(taskId: string, node: NodeEntity) {
        const downloadTask: DownloadQueueTask = {
            taskId,
            node,
            downloadId: this.downloadId,
            start: async () => {
                this.scheduledTasksAwaitingStart = Math.max(this.scheduledTasksAwaitingStart - 1, 0);
                this.pendingArchiveTasks += 1;
                const parentPath = this.parentPathByUid.get(node.uid) ?? [];
                const archivePromise = this.createArchiveItem(taskId, node, parentPath);
                archivePromise
                    .then((item) => {
                        if (!this.hasProducedItem) {
                            this.hasProducedItem = true;
                        }
                        if (item.isFile) {
                            this.totalClaimedSize += getNodeStorageSize(node);
                        }
                        this.tracker.notifyItemReady();
                        this.archiveItemsQueue.push(item);
                    })
                    .catch((error) => {
                        if (!this.hasProducedItem) {
                            this.tracker.notifyError(error);
                        }
                        this.archiveItemsQueue.error(error);
                    })
                    .finally(() => {
                        this.pendingArchiveTasks -= 1;
                        this.maybeCloseQueue();
                    });

                return archivePromise.then(() => this.tracker.waitForTaskCompletion(taskId));
            },
            storageSizeEstimate: getNodeStorageSize(node),
        };

        this.scheduledTasksAwaitingStart += 1;
        this.scheduler.scheduleDownload(downloadTask);
    }

    private maybeCloseQueue() {
        if (this.schedulingCompleted && this.pendingArchiveTasks === 0 && this.scheduledTasksAwaitingStart === 0) {
            this.archiveItemsQueue.close();
        }
    }

    private async scheduleEntries(): Promise<void> {
        try {
            for await (const entry of this.entries) {
                const taskId = this.scheduler.generateTaskId();
                this.insertArchiveEntryInScheduler(taskId, entry);
            }
            this.schedulingCompleted = true;
            this.maybeCloseQueue();
        } catch (error) {
            if (!this.hasProducedItem) {
                this.tracker.notifyError(error);
            }
            this.archiveItemsQueue.error(error);
        }
    }

    waitForFirstItem(): Promise<void> {
        return this.tracker.waitForFirstItem();
    }
}
