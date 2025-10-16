import { getDrive } from '@proton/drive';

import type { DownloadController } from './DownloadManager';
import type { ArchiveItem, DownloadQueueTask, DownloadScheduler, DownloadableItem } from './downloadTypes';
import { createAsyncQueue } from './utils/asyncQueue';

export type { ArchiveItem } from './downloadTypes';

type ArchiveTracker = {
    registerFile(uid: string): void;
    updateDownloadProgress(uid: string, downloadedBytes: number): void;
    attachController(entry: DownloadableItem, controller: DownloadController): void;
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
        registerFile(uid: string) {
            downloadedBytesMap[uid] = 0;
        },
        updateDownloadProgress(uid: string, downloadedBytes: number) {
            downloadedBytesMap[uid] = downloadedBytes;
            updateTotalProgress();
        },
        attachController(entry: DownloadableItem, controller: DownloadController) {
            controllerByUid.set(entry.uid, controller);

            const completionPromise = controller.completion().finally(() => {
                completionPromises.delete(entry.uid);
                controllerByUid.delete(entry.uid);
            });

            completionPromises.set(entry.uid, completionPromise);
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
    entry: DownloadableItem,
    tracker: ArchiveTracker,
    abortSignal: AbortSignal
): Promise<ArchiveItem> => {
    if (!entry.isFile) {
        return {
            isFile: false,
            name: entry.name,
            parentPath: entry.parentPath ?? [],
        };
    }

    const drive = getDrive();
    const downloader = await drive.getFileDownloader(entry.uid, abortSignal);

    const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>>();
    tracker.registerFile(entry.uid);

    let controller: DownloadController;
    try {
        controller = downloader.downloadToStream(writable, (downloadedBytes) => {
            tracker.updateDownloadProgress(entry.uid, downloadedBytes);
        });
    } catch (error) {
        throw error;
    }

    tracker.attachController(entry, controller);

    return {
        isFile: true,
        name: entry.name,
        parentPath: entry.parentPath ?? [],
        stream: readable,
        fileModifyTime: entry.fileModifyTime,
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
        private readonly entries: AsyncIterable<DownloadableItem>,
        onProgress: (downloadedBytes: number) => void,
        private readonly scheduler: DownloadScheduler,
        private readonly abortSignal: AbortSignal
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

    private insertArchiveEntryInScheduler(entry: DownloadableItem) {
        const downloadTask: DownloadQueueTask = {
            nodes: [],
            start: async () => {
                this.pendingArchiveTasks += 1;
                const archivePromise = createArchiveItem(entry, this.tracker, this.abortSignal);

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
            storageSizeEstimate: entry.storageSize,
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
                this.insertArchiveEntryInScheduler(entry);
            }
            this.schedulingCompleted = true;
            this.maybeCloseQueue();
        } catch (error) {
            this.archiveItemsQueue.error(error);
        }
    }
}
