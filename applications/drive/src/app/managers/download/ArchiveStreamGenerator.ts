import type { NodeEntity } from '@proton/drive/index';
import { NodeType, getDrive } from '@proton/drive/index';

import type { DownloadController } from './DownloadManager';
import type { ArchiveItem, DownloadQueueTask, DownloadScheduler } from './downloadTypes';
import { createAsyncQueue } from './utils/asyncQueue';
import { getNodeModifiedTime } from './utils/nodeHelpers';

export type { ArchiveItem } from './downloadTypes';

type ArchiveTracker = {
    registerFile(taskId: string): void;
    updateDownloadProgress(taskId: string, downloadedBytes: number): void;
    attachController(taskId: string, controller: DownloadController): void;
    pauseAll(): void;
    resumeAll(): void;
    waitForCompletion(): Promise<void>;
};

/**
 * Called to start the creation of a new archive
 * will keep track of the individual files being downloaded while they are scheduled
 * it's a sort of orchestrator object
 */
const createArchiveTracker = (onProgress: (downloadedBytes: number) => void): ArchiveTracker => {
    // Each file of the archive records its own downloaded bytes
    const downloadedBytesMap: Record<string, number> = {};
    const controllerByUid = new Map<string, DownloadController>();
    const completionPromises = new Map<string, Promise<void>>();

    const updateTotalProgress = () => {
        const inFlightBytes = Object.values(downloadedBytesMap).reduce((acc, val) => acc + val, 0);
        onProgress(inFlightBytes);
    };

    return {
        registerFile(taskId: string) {
            downloadedBytesMap[taskId] = 0;
        },
        updateDownloadProgress(taskId: string, downloadedBytes: number) {
            downloadedBytesMap[taskId] = downloadedBytes;
            updateTotalProgress();
        },
        attachController(taskId: string, controller: DownloadController) {
            controllerByUid.set(taskId, controller);

            const completionPromise = controller.completion().finally(() => {
                completionPromises.delete(taskId);
                controllerByUid.delete(taskId);
            });

            completionPromises.set(taskId, completionPromise);
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
    };
};

/**
 * createArchiveItem sets things up: it registers the file, kicks off downloader.writeToStream,
 * and returns the ArchiveItem.
 * It does not wait for the network transfer to finish.
 */
const createArchiveItem = async (
    taskId: string,
    node: NodeEntity,
    parentPath: string[],
    tracker: ArchiveTracker,
    scheduler: DownloadScheduler,
    abortSignal: AbortSignal
): Promise<ArchiveItem> => {
    if (node.type !== NodeType.File) {
        return {
            isFile: false,
            name: node.name,
            parentPath,
        };
    }

    const drive = getDrive();
    const downloader = await drive.getFileDownloader(node.uid, abortSignal);

    const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>>();
    tracker.registerFile(taskId);

    let controller: DownloadController;
    try {
        controller = downloader.downloadToStream(writable, (downloadedBytes) => {
            tracker.updateDownloadProgress(taskId, downloadedBytes);
            scheduler.updateDownloadProgress(taskId, downloadedBytes);
        });
    } catch (error) {
        throw error;
    }

    tracker.attachController(taskId, controller);

    return {
        isFile: true,
        name: node.name,
        parentPath,
        stream: readable,
        fileModifyTime: getNodeModifiedTime(node),
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

    readonly generator: AsyncGenerator<ArchiveItem>;
    readonly controller: DownloadController;

    constructor(
        private readonly entries: AsyncIterable<NodeEntity>,
        onProgress: (downloadedBytes: number) => void,
        private readonly scheduler: DownloadScheduler,
        private readonly abortSignal: AbortSignal,
        private readonly parentPathByUid: Map<string, string[]>
    ) {
        this.tracker = createArchiveTracker(onProgress);
        this.generator = this.createGenerator();
        this.controller = {
            pause: () => this.tracker.pauseAll(),
            resume: () => this.tracker.resumeAll(),
            completion: () => this.tracker.waitForCompletion(),
        };

        void this.scheduleEntries();
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
            start: async () => {
                this.pendingArchiveTasks += 1;
                const parentPath = this.parentPathByUid.get(node.uid) ?? [];
                const archivePromise = createArchiveItem(
                    taskId,
                    node,
                    parentPath,
                    this.tracker,
                    this.scheduler,
                    this.abortSignal
                );

                archivePromise
                    .then((item) => {
                        this.archiveItemsQueue.push(item);
                    })
                    .catch((error) => {
                        this.archiveItemsQueue.error(error);
                    })
                    .finally(() => {
                        this.pendingArchiveTasks -= 1;
                        this.maybeCloseQueue();
                    });

                return {
                    completion: archivePromise.then(() => {}),
                };
            },
            storageSizeEstimate: node.activeRevision?.storageSize ?? 0,
        };

        this.scheduler.scheduleDownload(downloadTask);
    }

    private maybeCloseQueue() {
        if (this.schedulingCompleted && this.pendingArchiveTasks === 0) {
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
            this.archiveItemsQueue.error(error);
        }
    }
}
