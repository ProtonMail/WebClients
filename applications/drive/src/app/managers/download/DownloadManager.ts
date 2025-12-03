import type { NodeEntity, ProtonDriveClient } from '@proton/drive/index';
import { AbortError, NodeType, SDKEvent, getDrive, getDriveForPhotos } from '@proton/drive/index';
import { getFileExtension } from '@proton/shared/lib/helpers/mimetype';

import fileSaver from '../../store/_downloads/fileSaver/fileSaver';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { bufferToStream } from '../../utils/stream';
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
import type { DownloadQueueTaskHandle } from './downloadTypes';
import { downloadLogDebug } from './utils/downloadLogger';
import { getDownloadSdk } from './utils/getDownloadSdk';
import { getNodeStorageSize } from './utils/getNodeStorageSize';
import { hydrateAndCheckNodes, hydratePhotos } from './utils/hydrateAndCheckNodes';
import { traverseNodeStructure } from './utils/traverseNodeStructure';

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
    private requestedDownloads = new Map<string, NodeEntity[]>();

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
        const drivePhotos = getDriveForPhotos();

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
        drivePhotos.onMessage(SDKEvent.TransfersPaused, () => {
            this.activeDownloads.forEach((_, downloadId) => {
                if (getQueueItem(downloadId)?.status === DownloadStatus.InProgress) {
                    this.updateStatus([downloadId], DownloadStatus.PausedServer);
                }
            });
        });
        drivePhotos.onMessage(SDKEvent.TransfersResumed, () => {
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

    async downloadPhotos(nodeUids: string[], albumName?: string) {
        if (!nodeUids.length) {
            return;
        }
        const { nodes } = await hydratePhotos(nodeUids);
        if (!nodes.length) {
            return;
        }
        const { addDownloadItem } = useDownloadManagerStore.getState();
        this.addListeners();

        const isSingleFileDownload = nodes.length === 1 && nodes[0].type === NodeType.File;
        let downloadId;
        if (isSingleFileDownload) {
            const node = nodes[0];
            downloadId = addDownloadItem({
                name: node.name,
                storageSize: getNodeStorageSize(node),
                downloadedBytes: 0,
                status: DownloadStatus.Pending,
                nodeUids: [node.uid],
                unsupportedFileDetected: undefined,
                isPhoto: true,
            });
            this.requestedDownloads.set(downloadId, nodes);
            void this.scheduleSingleFileDownload(downloadId, node);
        } else {
            const archiveName = albumName ? `${albumName}.zip` : this.getArchiveName(nodes);
            downloadId = addDownloadItem({
                name: archiveName,
                storageSize: undefined,
                downloadedBytes: 0,
                status: DownloadStatus.Pending,
                nodeUids: nodes.map(({ uid }) => uid),
                unsupportedFileDetected: undefined,
                isPhoto: true,
            });
            this.requestedDownloads.set(downloadId, nodes);
            // While the single file can be immediately queued and scheduled, the archive first needs to be traversed
            // then one by one all "discovered" files get scheduled for download
            void this.scheduleArchiveDownload(downloadId, nodes);
        }

        downloadLogDebug('Queue photo download', {
            downloadId,
            fileMediaTypes: nodes.map((f) => f.mediaType),
        });
    }

    // TODO: Add possibility to just pass the uid instead of whole node
    async downloadFromBuffer(node: NodeEntity, buffer: Uint8Array<ArrayBuffer>[], mimeType?: string) {
        const stream = bufferToStream(buffer);
        const storageSize = getNodeStorageSize(node);

        const log = (message: string) => downloadLogDebug('FileSaver', message);
        await fileSaver.instance.saveAsFile(
            stream,
            {
                filename: node.name,
                mimeType: mimeType ?? DEFAULT_MIME_TYPE,
            },
            log
        );

        const { addDownloadItem } = useDownloadManagerStore.getState();
        addDownloadItem({
            name: node.name,
            storageSize,
            status: DownloadStatus.Finished,
            nodeUids: [node.uid],
            downloadedBytes: storageSize,
            isPhoto: false,
        });
    }

    async download(nodeUids: string[]) {
        if (!nodeUids.length) {
            return;
        }
        const { nodes, containsUnsupportedFile } = await hydrateAndCheckNodes(nodeUids);
        if (!nodes.length) {
            return;
        }
        const { addDownloadItem } = useDownloadManagerStore.getState();
        this.addListeners();

        const isSingleFileDownload = nodes.length === 1 && nodes[0].type === NodeType.File;
        let downloadId;
        if (isSingleFileDownload) {
            if (containsUnsupportedFile) {
                return;
            }
            const node = nodes[0];
            downloadId = addDownloadItem({
                name: node.name,
                storageSize: getNodeStorageSize(node),
                downloadedBytes: 0,
                status: DownloadStatus.Pending,
                nodeUids: [node.uid],
                unsupportedFileDetected: containsUnsupportedFile ? 'detected' : undefined,
                // TODO: Add support for photos
                isPhoto: false,
            });
            this.requestedDownloads.set(downloadId, nodes);
            void this.scheduleSingleFileDownload(downloadId, node);
        } else {
            const archiveName = this.getArchiveName(nodes);
            downloadId = addDownloadItem({
                name: archiveName,
                storageSize: undefined,
                downloadedBytes: 0,
                status: DownloadStatus.Pending,
                nodeUids: nodes.map(({ uid }) => uid),
                unsupportedFileDetected: containsUnsupportedFile ? 'detected' : undefined,
                isPhoto: false,
            });
            this.requestedDownloads.set(downloadId, nodes);
            // While the single file can be immediately queued and scheduled, the archive first needs to be traversed
            // then one by one all "discovered" files get scheduled for download
            void this.scheduleArchiveDownload(downloadId, nodes);
        }

        downloadLogDebug('Queue download', {
            downloadId,
            containsUnsupportedFile,
            fileMediaTypes: nodes.map((f) => f.mediaType),
        });
    }

    private async scheduleSingleFileDownload(downloadId: string, node: NodeEntity) {
        this.scheduler.scheduleDownload({
            taskId: downloadId,
            node,
            storageSizeEstimate: getNodeStorageSize(node),
            start: () => this.startSingleFileDownload(node, downloadId),
            downloadId,
        });
    }

    private async startSingleFileDownload(node: NodeEntity, downloadId: string): Promise<DownloadQueueTaskHandle> {
        const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();
        const drive = getDownloadSdk(downloadId);

        const abortController = new AbortController();
        let fileDownloader: FileDownloader;
        let completionPromise: Promise<void>;
        let currentDownloadedBytes = 0;

        try {
            fileDownloader = await drive.getFileDownloader(node.uid, abortController.signal);
            const storageSize = getNodeStorageSize(node);
            updateDownloadItem(downloadId, { storageSize: storageSize, status: DownloadStatus.InProgress });

            const { readable, writable } = new TransformStream<Uint8Array<ArrayBuffer>>();
            const streamWrapperPromise = loadCreateReadableStreamWrapper(readable);

            const controller = fileDownloader.downloadToStream(writable, (downloadedBytes) => {
                currentDownloadedBytes = downloadedBytes;
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
            });

            const streamForSaver: ReadableStream<Uint8Array<ArrayBuffer>> = await streamWrapperPromise;

            // eslint-disable-next-line no-console
            const log = (message: string) => console.debug(`[DownloadManager] ${downloadId}: ${message}`);
            const savePromise = fileSaver.instance.saveAsFile(
                streamForSaver,
                { filename: node.name, mimeType: DEFAULT_MIME_TYPE, size: getNodeStorageSize(node) },
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
                    // At the moment images storageSize mistakenly includes the thumbnail, to avoid progress showing <100%
                    // we force the downloaded size to match the storage size until this is fixed
                    updateDownloadItem(downloadId, { status: DownloadStatus.Finished, downloadedBytes: storageSize });
                    downloadLogDebug('Completed download', { downloadId, currentDownloadedBytes, storageSize });
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
            this.handleError(error, downloadId, [node]);
            completionPromise = Promise.reject(error);
        }

        return { completion: completionPromise };
    }

    private async scheduleArchiveDownload(downloadId: string, nodes: NodeEntity[]): Promise<void> {
        const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();
        const queueItem = getQueueItem(downloadId);
        const archiveName = queueItem?.name ?? this.getArchiveName(nodes);
        let currentDownloadedBytes = 0;

        const abortController = new AbortController();

        const handleArchiveError = (error: unknown) => {
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
                this.handleError(error, downloadId, nodes);
            }
        };

        try {
            // Traversing all folders to get the node entities + parentPath
            const { nodesQueue, totalEncryptedSize, parentPathByUid, containsUnsupportedFile } =
                await traverseNodeStructure(nodes, abortController.signal);

            // Traversal is completed at this point so the size is known and the queue is closed
            updateDownloadItem(downloadId, { storageSize: totalEncryptedSize, status: DownloadStatus.InProgress });
            if (containsUnsupportedFile) {
                updateDownloadItem(downloadId, { unsupportedFileDetected: 'detected' });
            }

            const updateProgress = (downloadedBytes: number) => {
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
                currentDownloadedBytes = downloadedBytes;
            };

            // Traversal already populated and closed the queue; pass it to the generator to build the archive
            const archiveStreamGenerator = new ArchiveStreamGenerator(
                nodesQueue.iterator(),
                updateProgress,
                this.scheduler,
                abortController.signal,
                parentPathByUid,
                downloadId
            );
            const generator = archiveStreamGenerator.generator;
            const trackerController = archiveStreamGenerator.controller;

            const log = (message: string) => downloadLogDebug('FileSaver', message);
            const archiveGenerator = new ArchiveGenerator();
            abortController.signal.addEventListener('abort', () => archiveGenerator.cancel());

            const startArchiveSaving = () => {
                const archivePromise = archiveGenerator.writeLinks(generator);
                void archivePromise.then(() => {
                    this.updateStatus([downloadId], DownloadStatus.Finalizing);
                });

                const savePromise = fileSaver.instance.saveAsFile(
                    archiveGenerator.stream,
                    {
                        filename: archiveName,
                        mimeType: 'application/zip',
                        size: totalEncryptedSize > 0 ? totalEncryptedSize : undefined,
                    },
                    log
                );

                return Promise.all([archivePromise, savePromise]).then(() => {});
            };

            const savingPromise = archiveStreamGenerator.waitForFirstItem().then(() => startArchiveSaving());

            const controllerProxy: DownloadController = {
                pause: () => trackerController.pause(),
                resume: () => trackerController.resume(),
                completion: () => savingPromise.then(() => {}),
            };

            this.activeDownloads.set(downloadId, {
                controller: controllerProxy,
                abortController,
            });

            savingPromise
                .then(() => {
                    // At the moment images storageSize mistakenly includes the thumbnail, to avoid progress showing <100%
                    // we force the downloaded size to match the storage size until this is fixed
                    updateDownloadItem(downloadId, {
                        status: DownloadStatus.Finished,
                        downloadedBytes: totalEncryptedSize,
                    });
                    downloadLogDebug('Completed download', { downloadId, currentDownloadedBytes, totalEncryptedSize });
                })
                .catch((error) => {
                    handleArchiveError(error);
                })
                .finally(() => {
                    this.activeDownloads.delete(downloadId);
                });
        } catch (error) {
            handleArchiveError(error);
        }
    }

    private handleError(error: unknown, downloadId: string, nodes: NodeEntity[]) {
        const { updateDownloadItem } = useDownloadManagerStore.getState();
        const errorToHandle = error instanceof Error ? error : new Error('Unexpected Download Error');
        updateDownloadItem(downloadId, { status: DownloadStatus.Failed, error: errorToHandle });

        sendErrorReport(
            new EnrichedError(errorToHandle.message, {
                tags: {
                    component: 'download-manager',
                },
                extra: {
                    filesTypes: nodes.map((f) => getFileExtension(f.name)),
                    storageSize: nodes.reduce((acc, node) => getNodeStorageSize(node) + acc, 0),
                },
            })
        );
    }

    private getArchiveName(nodes: NodeEntity[]): string {
        if (nodes.length === 1) {
            return `${nodes[0].name}.zip`;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `Download ${timestamp}.zip`;
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
            if (storeItem && this.activeDownloads.has(id)) {
                downloadLogDebug('Cancel download', { downloadId: id, isActive: true });
                void this.stopDownload(downloadIds);
            } else if (storeItem && this.requestedDownloads.has(id)) {
                downloadLogDebug('Cancel download', { downloadId: id, isPending: true });
                this.requestedDownloads.delete(id);
                this.scheduler.cancelDownloadsById(id);
            }
            this.updateStatus(downloadIds, DownloadStatus.Cancelled);
        });
    }

    retry(downloadIds: string[] = []) {
        const { getQueueItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => {
            const storeItem = getQueueItem(id);
            const requestedDownload = this.requestedDownloads.get(id);
            if (storeItem && requestedDownload) {
                downloadLogDebug('Retry download', { downloadId: id });
                if (requestedDownload.length === 1 && requestedDownload[0].type !== NodeType.Folder) {
                    void this.scheduleSingleFileDownload(id, requestedDownload[0]);
                } else {
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
