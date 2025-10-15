import { getDrive } from '@proton/drive';

import type { DownloadController } from '../DownloadManager';
import type {
    ArchiveItem,
    ArchiveStreamGeneratorResult,
    DownloadQueueTask,
    DownloadScheduler,
    DownloadableItem,
} from '../downloadTypes';
import { createAsyncQueue } from './asyncQueue';

export type { ArchiveItem, ArchiveStreamGeneratorResult } from '../downloadTypes';

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
 */
const createArchiveTracker = (onProgress: (downloadedBytes: number) => void): ArchiveTracker => {
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
            return Promise.all(pendingCompletions).then(() => {});
        },
    };
};

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
        controller = downloader.writeToStream(writable, (downloadedBytes) => {
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
 *
 * @returns {ArchiveStreamGeneratorResult} Object exposing the async generator (yielding entries in traversal order)
 * and a getter that aggregates the active controllers for pause/resume/completion operations.
 */
export function createArchiveStreamGenerator(
    entries: AsyncIterable<DownloadableItem>,
    onProgress: (downloadedBytes: number) => void,
    scheduler: DownloadScheduler,
    abortSignal: AbortSignal
): ArchiveStreamGeneratorResult {
    const tracker = createArchiveTracker(onProgress);
    const archiveItemsQueue = createAsyncQueue<ArchiveItem>();
    let pendingArchiveTasks = 0;
    let schedulingCompleted = false;

    const maybeCloseQueue = () => {
        if (schedulingCompleted && pendingArchiveTasks === 0) {
            archiveItemsQueue.close();
        }
    };

    const scheduleArchiveEntry = (entry: DownloadableItem) => {
        const downloadTask: DownloadQueueTask = {
            nodes: [],
            start: async () => {
                pendingArchiveTasks += 1;
                const archivePromise = createArchiveItem(entry, tracker, abortSignal);

                archivePromise
                    .then((item) => {
                        archiveItemsQueue.push(item);
                    })
                    .catch((error) => {
                        archiveItemsQueue.error(error);
                    })
                    .finally(() => {
                        pendingArchiveTasks -= 1;
                        maybeCloseQueue();
                    });

                return {
                    completion: archivePromise.then(() => {}),
                };
            },
            storageSizeEstimate: entry.storageSize,
        };

        scheduler.scheduleDownload(downloadTask);
    };

    (async () => {
        try {
            for await (const entry of entries) {
                scheduleArchiveEntry(entry);
            }
            schedulingCompleted = true;
            maybeCloseQueue();
        } catch (error) {
            archiveItemsQueue.error(error);
        }
    })();

    const generator = (async function* generate() {
        for await (const item of archiveItemsQueue.iterator()) {
            yield item;
        }

        await tracker.waitForCompletion();
    })();

    const aggregateController: DownloadController = {
        pause: () => tracker.pauseAll(),
        resume: () => tracker.resumeAll(),
        completion: () => tracker.waitForCompletion(),
    };

    return {
        generator,
        controller: aggregateController,
    };
}
