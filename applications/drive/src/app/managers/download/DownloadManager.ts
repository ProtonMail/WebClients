import type { ProtonDriveClient } from '@proton/drive';
import { AbortError, SDKEvent, getDrive } from '@proton/drive';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';

import fileSaver from '../../store/_downloads/fileSaver/fileSaver';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { loadCreateReadableStreamWrapper } from '../../utils/webStreamsPolyfill';
import type { DownloadItem } from '../../zustand/download/downloadManager.store';
import {
    DownloadStatus,
    MalawareDownloadResolution,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import ArchiveGenerator from './ArchiveGenerator';
import { ArchiveStreamGenerator } from './ArchiveStreamGenerator';
import { DownloadScheduler } from './DownloadScheduler';
import type { DownloadQueueTaskHandle, DownloadableItem } from './downloadTypes';
import { nodesStructureTraversal } from './utils/nodesStructureTraversal';

const DEFAULT_MIME_TYPE = 'application/octet-stream';

export type FileDownloader = Awaited<ReturnType<ProtonDriveClient['getFileDownloader']>>;
export type DownloadController = ReturnType<FileDownloader['downloadToStream']>;

type ActiveDownload = {
    controller: DownloadController;
    abortController: AbortController;
    completionPromise?: Promise<void>;
};

export class DownloadManager {
    private static instance: DownloadManager | undefined;
    private hasListeners;
    private scheduler: DownloadScheduler;
    private readonly activeDownloads = new Map<string, ActiveDownload>();
    private requestedDownloads = new Map<string, DownloadableItem[]>();

    constructor() {
        this.hasListeners = false;
        this.scheduler = new DownloadScheduler();
    }

    static getInstance(): DownloadManager {
        if (!DownloadManager.instance) {
            DownloadManager.instance = new DownloadManager();
        }

        return DownloadManager.instance;
    }

    addListeners() {
        if (this.hasListeners) {
            return;
        }
        this.hasListeners = true;
        const drive = getDrive();

        const { getQueueItem } = useDownloadManagerStore.getState();

        drive.onMessage(SDKEvent.TransfersPaused, () => {
            this.activeDownloads.forEach((_, downloadId) => {
                if (getQueueItem(downloadId)?.status === DownloadStatus.InProgress) {
                    this.updateStatus([downloadId], DownloadStatus.PausedServer);
                }
            });
        });
        drive.onMessage(SDKEvent.TransfersResumed, () => {
            this.activeDownloads.forEach((_, downloadId) => {
                if (getQueueItem(downloadId)?.status === DownloadStatus.PausedServer) {
                    this.updateStatus([downloadId], DownloadStatus.InProgress);
                }
            });
        });
    }

    onIntegrityIssue(downloadId: string) {
        console.warn('onIntegrityIssue not implemented', downloadId);
    }

    async download(nodes: DownloadableItem[]) {
        if (!nodes.length) {
            return;
        }
        this.addListeners();
        const { addDownloadItem } = useDownloadManagerStore.getState();

        const isSingleFileDownload = nodes.length === 1 && nodes[0].isFile;

        if (isSingleFileDownload) {
            const node = nodes[0];
            const downloadId = addDownloadItem({
                name: node.name,
                storageSize: node.storageSize,
                downloadedBytes: 0,
                status: DownloadStatus.Pending,
                nodeUids: [node.uid],
            });
            this.requestedDownloads.set(downloadId, nodes);
            void this.scheduleSingleFileDownload(downloadId, node);
        } else {
            const archiveName = this.getArchiveName(nodes);
            const downloadId = addDownloadItem({
                name: archiveName,
                storageSize: undefined,
                downloadedBytes: 0,
                status: DownloadStatus.Pending,
                nodeUids: nodes.map(({ uid }) => uid),
            });
            this.requestedDownloads.set(downloadId, nodes);

            // While the single file can be immediately queued and scheduled, the archive first needs to be traversed
            // then one by one all "discovered" files get scheduled for download
            this.scheduleArchiveDownload(downloadId, nodes);
        }
    }

    private async scheduleSingleFileDownload(downloadId: string, node: DownloadableItem) {
        this.scheduler.scheduleDownload({
            taskId: downloadId,
            node,
            storageSizeEstimate: node.storageSize,
            start: () => this.startSingleFileDownload(node, downloadId),
        });
    }

    private async startSingleFileDownload(
        node: DownloadableItem,
        downloadId: string
    ): Promise<DownloadQueueTaskHandle> {
        const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();
        const drive = getDrive();

        const abortController = new AbortController();
        let fileDownloader: FileDownloader;
        let completionPromise: Promise<void>;

        try {
            fileDownloader = await drive.getFileDownloader(node.uid, abortController.signal);
            const claimedSize = fileDownloader.getClaimedSizeInBytes();
            updateDownloadItem(downloadId, { storageSize: claimedSize });
            updateDownloadItem(downloadId, {
                status: DownloadStatus.InProgress,
            });

            const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>>();
            const streamWrapperPromise = loadCreateReadableStreamWrapper(readable);

            const controller = fileDownloader.downloadToStream(writable, (downloadedBytes) => {
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
            });

            const streamForSaver: ReadableStream<Uint8Array<ArrayBuffer>> = await streamWrapperPromise;

            // eslint-disable-next-line no-console
            const log = (message: string) => console.debug(`[DownloadManager] ${downloadId}: ${message}`);
            const savePromise = fileSaver.instance.saveAsFile(
                streamForSaver,
                { filename: node.name, mimeType: DEFAULT_MIME_TYPE, size: node.storageSize },
                log
            );

            const controllerCompletion = controller.completion();

            void controllerCompletion.then(() => {
                this.updateStatus([downloadId], DownloadStatus.Finalizing);
            });

            this.activeDownloads.set(downloadId, {
                controller,
                abortController,
            });

            completionPromise = Promise.all([controllerCompletion, savePromise])
                .then(() => {
                    updateDownloadItem(downloadId, { status: DownloadStatus.Finished });
                })
                .catch((error) => {
                    const existing = getQueueItem(downloadId);
                    if (!existing) {
                        return;
                    }
                    if (existing.status === DownloadStatus.Cancelled || error instanceof AbortError) {
                        updateDownloadItem(downloadId, { status: DownloadStatus.Cancelled, error: undefined });
                    } else {
                        updateDownloadItem(downloadId, { status: DownloadStatus.Failed, error: error });
                    }
                })
                .finally(() => {
                    this.activeDownloads.delete(downloadId);
                });
        } catch (error) {
            const errorToHandle = error instanceof Error ? error : new Error('Unexpected Download Error');
            updateDownloadItem(downloadId, { status: DownloadStatus.Failed, error: error });
            sendErrorReport(
                new EnrichedError(errorToHandle.message, {
                    tags: {
                        component: 'download-manager',
                    },
                    extra: {
                        filesTypes: getFileExtension(node.name),
                        storageSize: node.storageSize,
                    },
                })
            );
            completionPromise = Promise.reject(errorToHandle);
        }

        return { completion: completionPromise };
    }

    private scheduleArchiveDownload(downloadId: string, nodes: DownloadableItem[]): void {
        const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();
        const queueItem = getQueueItem(downloadId);
        const archiveName = queueItem?.name ?? this.getArchiveName(nodes);
        let archiveSizeInBytes = 0;

        const abortController = new AbortController();

        try {
            // Traversing all folders to get the node entities + parentPath
            const { nodesQueue, totalEncryptedSizePromise } = nodesStructureTraversal(nodes, abortController.signal);

            // We can only know the full size of the archive after traversing all nodes
            void totalEncryptedSizePromise.then((totalSize) => {
                updateDownloadItem(downloadId, { storageSize: totalSize });
                archiveSizeInBytes = totalSize;
            });
            updateDownloadItem(downloadId, { status: DownloadStatus.InProgress });

            const updateProgress = (downloadedBytes: number) => {
                updateDownloadItem(downloadId, { downloadedBytes });
            };

            // While the traversal is happening the nodesQueue is populated with entities to archive
            // and passed to the ArchiveStreamGenerator that will create archive and update download progress
            const archiveStreamGenerator = new ArchiveStreamGenerator(
                nodesQueue.iterator(),
                updateProgress,
                this.scheduler,
                abortController.signal
            );
            const generator = archiveStreamGenerator.generator;
            const trackerController = archiveStreamGenerator.controller;

            // eslint-disable-next-line no-console
            const log = (message: string) => console.debug(`[DownloadManager] ${downloadId}: ${message}`);
            const archiveGenerator = new ArchiveGenerator();
            abortController.signal.addEventListener('abort', () => archiveGenerator.cancel());

            // Archive creation
            const archivePromise = archiveGenerator.writeLinks(generator);
            void archivePromise.then(() => {
                this.updateStatus([downloadId], DownloadStatus.Finalizing);
            });

            // Saving file
            const savePromise = fileSaver.instance.saveAsFile(
                archiveGenerator.stream,
                {
                    filename: archiveName,
                    mimeType: 'application/zip',
                    size: archiveSizeInBytes > 0 ? archiveSizeInBytes : undefined,
                },
                log
            );

            const combinedCompletion = Promise.all([totalEncryptedSizePromise, archivePromise, savePromise]);

            const controllerProxy: DownloadController = {
                pause: () => trackerController.pause(),
                resume: () => trackerController.resume(),
                completion: () => combinedCompletion.then(() => {}),
            };

            this.activeDownloads.set(downloadId, {
                controller: controllerProxy,
                abortController,
            });

            combinedCompletion
                .then(() => {
                    updateDownloadItem(downloadId, { status: DownloadStatus.Finished });
                })
                .catch((error) => {
                    const existing = getQueueItem(downloadId);
                    if (!existing) {
                        return;
                    }
                    if (
                        existing.status === DownloadStatus.Cancelled ||
                        abortController.signal.aborted ||
                        error instanceof AbortError
                    ) {
                        updateDownloadItem(downloadId, { status: DownloadStatus.Cancelled, error: undefined });
                    } else {
                        updateDownloadItem(downloadId, { status: DownloadStatus.Failed, error });
                    }
                })
                .finally(() => {
                    this.activeDownloads.delete(downloadId);
                });
        } catch (error) {
            const errorToHandle = error instanceof Error ? error : new Error('Unexpected Download Error');
            updateDownloadItem(downloadId, { status: DownloadStatus.Failed, error: error });
            sendErrorReport(
                new EnrichedError(errorToHandle.message, {
                    tags: {
                        component: 'download-manager',
                    },
                    extra: {
                        filesTypes: nodes.map((f) => getFileExtension(f.name)),
                        archiveSizeInBytes,
                    },
                })
            );
        }
    }

    private getArchiveName(nodes: DownloadableItem[]): string {
        if (nodes.length === 1) {
            return `${nodes[0].name}.zip`;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `Download-${timestamp}.zip`;
    }

    resolveMalwareDetection(downloadId: string, resolution: MalawareDownloadResolution) {
        if (resolution === MalawareDownloadResolution.CancelDownload) {
            this.cancel([downloadId]);
        }
        if (resolution === MalawareDownloadResolution.ContinueDownload) {
            this.resume([downloadId]);
        }
    }

    pause(downloadIds: string[] = []) {
        const { getQueueItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => {
            const storeItem = getQueueItem(id);
            const activeDownload = this.activeDownloads.get(id);
            if (storeItem && activeDownload && storeItem.status === DownloadStatus.InProgress) {
                activeDownload.controller.pause();
                this.updateStatus(downloadIds, DownloadStatus.Paused);
            }
        });
    }

    resume(downloadIds: string[] = []) {
        const { getQueueItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => {
            const storeItem = getQueueItem(id);
            const activeDownload = this.activeDownloads.get(id);
            if (storeItem && activeDownload && storeItem.status === DownloadStatus.Paused) {
                activeDownload.controller.resume();
                this.updateStatus(downloadIds, DownloadStatus.InProgress);
            }
        });
    }

    cancel(downloadIds: string[] = []) {
        const { getQueueItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => {
            const storeItem = getQueueItem(id);
            const activeDownload = this.activeDownloads.get(id);
            if (storeItem && activeDownload) {
                void this.stopDownload(downloadIds);
                this.updateStatus(downloadIds, DownloadStatus.Cancelled);
            }
        });
    }

    retry(downloadIds: string[] = []) {
        const { getQueueItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => {
            const storeItem = getQueueItem(id);
            const requestedDownload = this.requestedDownloads.get(id);
            if (storeItem && requestedDownload) {
                if (requestedDownload.length === 1) {
                    void this.scheduleSingleFileDownload(id, requestedDownload[0]);
                }
                if (requestedDownload.length > 1) {
                    void this.scheduleArchiveDownload(id, requestedDownload);
                }
            }
        });
    }

    async clear() {
        const { clearQueue, queue } = useDownloadManagerStore.getState();
        await this.stopDownload(Array.from(queue.keys()));
        this.scheduler.clearDownloads();
        clearQueue();
    }

    private async stopDownload(downloadIds: string[]) {
        downloadIds.forEach((id) => {
            const active = this.activeDownloads.get(id);
            active?.abortController.abort();
        });
    }

    private updateStatus(downloadIds: string[], status: DownloadItem['status']) {
        const { updateDownloadItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => updateDownloadItem(id, { status }));
    }
}

export const downloadManager = DownloadManager.getInstance();
