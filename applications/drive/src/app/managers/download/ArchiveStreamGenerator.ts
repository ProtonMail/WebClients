import type { NodeEntity } from '@proton/drive/index';
import { AbortError, NodeType } from '@proton/drive/index';

import { TransferCancel } from '../../utils/transfer';
import { IssueStatus, useDownloadManagerStore } from '../../zustand/download/downloadManager.store';
import type { DownloadController } from './DownloadManager';
import type { ArchiveItem, ArchiveTracker, DownloadQueueTask, DownloadScheduler } from './downloadTypes';
import type { MalwareDetection } from './malwareDetection/malwareDetection';
import { createAsyncQueue } from './utils/asyncQueue';
import { downloadLogDebug } from './utils/downloadLogger';
import { getDownloadSdk } from './utils/getDownloadSdk';
import { getNodeStorageSize } from './utils/getNodeStorageSize';
import { handleDownloadError } from './utils/handleError';
import { getNodeModifiedTime } from './utils/nodeHelpers';
import {
    addAndWaitForManifestIssueDecision,
    addAndWaitForMetadataIssueDecision,
    detectMetadataSignatureIssue,
} from './utils/signatureIssues';
import { waitForUnsupportedFileDecision } from './utils/waitForUserDecision';

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
    let lastError: unknown;
    const recordError = (error: unknown) => {
        lastError = error;
    };
    const firstItemPromise = new Promise<void>((resolve, reject) => {
        resolveFirstItem = resolve;
        rejectFirstItem = reject;
    });

    return {
        get lastError() {
            return lastError;
        },
        recordError,
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
            downloadLogDebug('ArchiveStreamGenerator waitForCompletion', { pendingCompletions });
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
            recordError(error);
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
type ArchiveStreamGeneratorParams = {
    entries: AsyncIterable<NodeEntity>;
    onProgress: (downloadedBytes: number, claimedSize: number) => void;
    scheduler: DownloadScheduler;
    abortController: AbortController;
    parentPathByUid: Map<string, string[]>;
    downloadId: string;
    malwareDetection: MalwareDetection;
};

export class ArchiveStreamGenerator {
    private readonly entries: AsyncIterable<NodeEntity>;
    private readonly scheduler: DownloadScheduler;
    private readonly abortController: AbortController;
    private readonly parentPathByUid: Map<string, string[]>;
    private readonly downloadId: string;
    // Queue of the items that have started actively downloading
    private readonly archiveItemsQueue = createAsyncQueue<ArchiveItem>();
    private pendingArchiveTasks = 0;
    private schedulingCompleted = false;
    private scheduledTasksAwaitingStart = 0;
    private hasProducedItem = false;
    private totalClaimedSize = 0;
    private hasSignatureIssues = false;
    private malwareDetection: MalwareDetection;

    readonly tracker: ArchiveTracker;
    readonly generator: AsyncGenerator<ArchiveItem>;
    readonly controller: DownloadController;

    get lastError(): unknown {
        return this.tracker.lastError;
    }

    constructor({
        entries,
        onProgress,
        scheduler,
        abortController,
        parentPathByUid,
        downloadId,
        malwareDetection,
    }: ArchiveStreamGeneratorParams) {
        this.entries = entries;
        this.scheduler = scheduler;
        this.abortController = abortController;
        this.parentPathByUid = parentPathByUid;
        this.downloadId = downloadId;
        this.malwareDetection = malwareDetection;
        this.tracker = createArchiveTracker(onProgress);
        this.generator = this.createGenerator();
        this.controller = {
            pause: () => this.tracker.pauseAll(),
            resume: () => this.tracker.resumeAll(),
            completion: () => this.tracker.waitForCompletion(),
            isDownloadCompleteWithSignatureIssues: () => this.hasSignatureIssues,
        };

        this.abortController.signal.addEventListener('abort', () => {
            const abortError = new AbortError();
            this.handleTrackerError(abortError);
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
        if (node.type !== NodeType.File && node.type !== NodeType.Photo) {
            const metadataIssueError = detectMetadataSignatureIssue(node);
            if (metadataIssueError !== undefined) {
                const decision = await addAndWaitForMetadataIssueDecision(this.downloadId, node, metadataIssueError);
                if (decision === IssueStatus.Approved) {
                    return { isFile: false, name: node.name, parentPath };
                } else {
                    // This is user cancellation
                    this.abortController.abort();
                }
            } else {
                return { isFile: false, name: node.name, parentPath };
            }
        }
        const { getQueueItem } = useDownloadManagerStore.getState();
        const drive = getDownloadSdk(this.downloadId);
        const downloader = await drive.getFileDownloader(node.uid, this.abortController.signal);
        const claimedSize = downloader.getClaimedSizeInBytes();

        const transformStream = new TransformStream<Uint8Array<ArrayBuffer>>();
        const streamWriter = transformStream.writable.getWriter();
        let writerClosed = false;
        // SDK expects a WritableStream, so wrap our writer while keeping control over it
        const writableForDownloader = new WritableStream<Uint8Array<ArrayBuffer>>({
            write(chunk) {
                return streamWriter.write(chunk);
            },
            close() {
                writerClosed = true;
                return streamWriter.close();
            },
            abort(reason) {
                writerClosed = true;
                return streamWriter.abort(reason);
            },
        });

        this.tracker.registerFile(taskId);

        const controller = downloader.downloadToStream(writableForDownloader, (downloadedBytes) => {
            this.tracker.updateDownloadProgress(taskId, downloadedBytes, this.totalClaimedSize);
            this.scheduler.updateDownloadProgress(taskId, downloadedBytes);
        });
        const queueItem = getQueueItem(this.downloadId);

        const completeIndividualFile = async () => {
            try {
                if (queueItem?.shouldScanForMalware) {
                    await this.malwareDetection.checkMalware(this.downloadId, node);
                    await this.malwareDetection.getPendingDecisionPromise(this.downloadId);
                }

                await controller.completion();
            } catch (error) {
                // Manifest issues cannot be inferred by metadata, can only be thrown when completing the download
                if (controller.isDownloadCompleteWithSignatureIssues()) {
                    this.hasSignatureIssues = true;
                    const decision = await addAndWaitForManifestIssueDecision(this.downloadId, node);
                    writerClosed = true;
                    if (decision === IssueStatus.Approved) {
                        void streamWriter.close();
                    } else {
                        // This is user cancellation
                        void streamWriter.abort(new TransferCancel({ id: this.downloadId }));
                    }
                } else {
                    void streamWriter.abort(error);
                    handleDownloadError(this.downloadId, [node], error, this.abortController.signal.aborted);
                    this.handleTrackerError(error);
                    this.archiveItemsQueue.error(error);
                    throw error;
                }
            } finally {
                if (!writerClosed) {
                    // writableForDownloader is locked by the SDK so we can't close it,
                    // but we own the underlying streamWriter so we can close that
                    streamWriter.close().catch(() => {
                        downloadLogDebug('Download error on closing streamWriter', { downloadId: this.downloadId });
                    });
                }
            }
        };

        if (queueItem?.unsupportedFileDetected) {
            await waitForUnsupportedFileDecision(this.downloadId, completeIndividualFile);
        }

        const metadataIssueError = detectMetadataSignatureIssue(node);
        if (metadataIssueError !== undefined) {
            const decision = await addAndWaitForMetadataIssueDecision(this.downloadId, node, metadataIssueError);
            if (decision === IssueStatus.Approved) {
                void completeIndividualFile();
            } else {
                // This is user cancellation
                void streamWriter.abort(new TransferCancel({ id: this.downloadId }));
            }
        } else {
            void completeIndividualFile();
        }

        this.tracker.attachController(taskId, controller);

        return {
            isFile: true,
            name: node.name,
            parentPath,
            stream: transformStream.readable,
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
                        this.handleTrackerError(error);
                        this.archiveItemsQueue.error(error);
                        throw error;
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
            this.handleTrackerError(error);
            this.archiveItemsQueue.error(error);
        }
    }

    waitForFirstItem(): Promise<void> {
        return this.tracker.waitForFirstItem();
    }

    private handleTrackerError(error: unknown) {
        this.tracker.recordError(error);
        if (!this.hasProducedItem) {
            this.tracker.notifyError(error);
        }
    }
}
