import type { NodeEntity, ProtonDriveClient } from '@proton/drive/index';
import { NodeType, SDKEvent, getDrive, getDriveForPhotos } from '@proton/drive/index';

import fileSaver from '../../store/_downloads/fileSaver/fileSaver';
import { bufferToStream, streamToBuffer } from '../../utils/stream';
import { TransferCancel } from '../../utils/transfer';
import type { DownloadItem } from '../../zustand/download/downloadManager.store';
import {
    DownloadStatus,
    MalawareDownloadResolution,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import ArchiveGenerator from './ArchiveGenerator';
import { ArchiveStreamGenerator } from './ArchiveStreamGenerator';
import { DownloadScheduler } from './DownloadScheduler';
import { createStreamSaver } from './utils/createStreamSaver';
import { downloadLogDebug } from './utils/downloadLogger';
import { getDownloadSdk } from './utils/getDownloadSdk';
import { getNodeStorageSize } from './utils/getNodeStorageSize';
import { handleDownloadError } from './utils/handleError';
import { hydrateAndCheckNodes, hydratePhotos } from './utils/hydrateAndCheckNodes';
import { traverseNodeStructure } from './utils/traverseNodeStructure';

const DEFAULT_MIME_TYPE = 'application/octet-stream';
/**
 * The timeout is chosen based on trial and error for a good responsivness without overbearing the UI with constant checks
 * If a user knows exactly what the modal is for it takes a second to click on it. Otherwise a few seconds.
 * At the same time if we set it too high you will feel the lag between closing the modal and finishing the transfer.
 */
const UNSUPPORTED_FILE_DECISION_TIMEOUT = 1500;

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
        this.scheduler = new DownloadScheduler((error, task) =>
            handleDownloadError(task.downloadId, [task.node], error)
        );
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

        const isSingleFileDownload = nodes.length === 1 && nodes[0].type === NodeType.Photo;
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

    private async startSingleFileDownload(node: NodeEntity, downloadId: string): Promise<void> {
        const { updateDownloadItem } = useDownloadManagerStore.getState();
        const drive = getDownloadSdk(downloadId);

        const abortController = new AbortController();
        let fileDownloader: FileDownloader;
        let completionPromise: Promise<void>;
        let currentDownloadedBytes = 0;

        try {
            fileDownloader = await drive.getFileDownloader(node.uid, abortController.signal);
            const storageSize = getNodeStorageSize(node);
            updateDownloadItem(downloadId, { storageSize: storageSize, status: DownloadStatus.InProgress });

            const log = (message: string) => downloadLogDebug('FileSaver', message);
            const streamSaver = createStreamSaver(
                { filename: node.name, mimeType: DEFAULT_MIME_TYPE, size: storageSize },
                log
            );

            const controller = fileDownloader.downloadToStream(streamSaver.writable, (downloadedBytes) => {
                currentDownloadedBytes = downloadedBytes;
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
            });

            completionPromise = this.attachActiveDownload({
                downloadId,
                controller,
                abortController,
                onCompleted: async () => {
                    try {
                        await streamSaver.finalize();
                    } catch (error) {
                        await streamSaver.abort(error);
                        handleDownloadError(downloadId, [node], error);
                    }
                    // At the moment images storageSize mistakenly includes the thumbnail, to avoid progress showing <100%
                    // we force the downloaded size to match the storage size until this is fixed
                    updateDownloadItem(downloadId, { status: DownloadStatus.Finished, downloadedBytes: storageSize });
                    downloadLogDebug('Completed download', { downloadId, currentDownloadedBytes, storageSize });
                },
                onError: async (error) => {
                    await streamSaver.abort(error);
                    handleDownloadError(downloadId, [node], error);
                },
            });
        } catch (error) {
            handleDownloadError(downloadId, [node], error);
            completionPromise = Promise.reject(error);
        }

        return completionPromise;
    }

    private async scheduleArchiveDownload(downloadId: string, nodes: NodeEntity[]): Promise<void> {
        const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();
        const queueItem = getQueueItem(downloadId);
        const archiveName = queueItem?.name ?? this.getArchiveName(nodes);
        let currentDownloadedBytes = 0;
        let totalEncryptedSize = 0;
        const abortController = new AbortController();

        try {
            // Traversing all folders to get the node entities + parentPath
            const { nodesQueue, traversalCompletedPromise, parentPathByUid } = traverseNodeStructure(
                nodes,
                abortController.signal
            );

            void traversalCompletedPromise.then((traversalResult) => {
                downloadLogDebug('Archive traversal complete', traversalResult);
                totalEncryptedSize = traversalResult.totalEncryptedSize;
                updateDownloadItem(downloadId, {
                    storageSize: totalEncryptedSize,
                    status: DownloadStatus.InProgress,
                    unsupportedFileDetected: traversalResult.containsUnsupportedFile ? 'detected' : undefined,
                });
            });

            const updateProgress = (downloadedBytes: number) => {
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
                currentDownloadedBytes = downloadedBytes;
            };

            const archiveGenerator = new ArchiveGenerator();
            const archiveStreamGenerator = new ArchiveStreamGenerator({
                entries: nodesQueue.iterator(),
                onProgress: updateProgress,
                scheduler: this.scheduler,
                abortSignal: abortController.signal,
                parentPathByUid,
                downloadId,
            });
            const generator = archiveStreamGenerator.generator;
            const trackerController = archiveStreamGenerator.controller;

            const log = (message: string) => downloadLogDebug('FileSaver', message);
            abortController.signal.addEventListener('abort', () => archiveGenerator.cancel());

            const waitForFirstItemPromise = archiveStreamGenerator.waitForFirstItem();

            const waitForUnsupportedDecision = () =>
                new Promise<void>((resolve, reject) => {
                    const checkDecision = () => {
                        const item = getQueueItem(downloadId);
                        if (!item) {
                            reject(new Error('Download item not found'));
                            return;
                        }
                        if (item.unsupportedFileDetected === 'approved') {
                            downloadLogDebug('unsupportedFileDetected decision approved', downloadId);
                            resolve();
                            return;
                        }
                        if (item.unsupportedFileDetected === 'rejected') {
                            downloadLogDebug('unsupportedFileDetected decision reject', downloadId);
                            reject();
                            return;
                        }
                        setTimeout(checkDecision, UNSUPPORTED_FILE_DECISION_TIMEOUT);
                    };
                    checkDecision();
                });

            /**
             * After we have traversed all nodes and we have containsUnsupportedFile
             * we wait for the user decision about unsupported file or continue if not detected.
             * For normal archives we stream directly to FileSaver.
             * For archives with unsupported files, we buffer the stream while waiting
             * for the decision so downloads can continue, and only save after approval.
             * If the user rejects the download, we never save the file.
             */
            const archivePromise = (async () => {
                await waitForFirstItemPromise;
                await archiveGenerator.writeLinks(generator);
                downloadLogDebug('Archive writeLinks done', { downloadId });
            })();

            const archiveBufferPromise = streamToBuffer(archiveGenerator.stream);

            const savingPromise = (async () => {
                const traversalResult = await traversalCompletedPromise;
                const meta = {
                    filename: archiveName,
                    mimeType: 'application/zip',
                    size: totalEncryptedSize > 0 ? totalEncryptedSize : undefined,
                } as const;

                if (traversalResult.containsUnsupportedFile) {
                    await waitForUnsupportedDecision();
                }

                await waitForFirstItemPromise;
                await trackerController.completion(); // propagates the first failure

                const buffer = await archiveBufferPromise;
                if (abortController.signal.aborted || archiveStreamGenerator.lastError) {
                    // Super important that we don't save the file if cancelled or erroring
                    return;
                }
                await fileSaver.instance.saveAsFile(bufferToStream(buffer), meta, log);
                downloadLogDebug('Archive saveAsFile (buffer) done', { downloadId });
            })();

            const combinedPromise = Promise.all([archivePromise, savingPromise]).then(() => {});

            const controllerProxy: DownloadController = {
                pause: () => trackerController.pause(),
                resume: () => trackerController.resume(),
                completion: () => combinedPromise,
                // TBI isDownloadCompleteWithSignatureIssues
                isDownloadCompleteWithSignatureIssues: () => false,
            };

            await this.attachActiveDownload({
                downloadId,
                controller: controllerProxy,
                abortController,
                onCompleted: async () => {
                    // At the moment images storageSize mistakenly includes the thumbnail, to avoid progress showing <100%
                    // we force the downloaded size to match the storage size until this is fixed
                    const currentItem = getQueueItem(downloadId);
                    if (
                        currentItem?.status !== DownloadStatus.Cancelled &&
                        currentItem?.status !== DownloadStatus.Failed
                    ) {
                        updateDownloadItem(downloadId, {
                            status: DownloadStatus.Finished,
                            downloadedBytes: totalEncryptedSize,
                        });
                    }
                    downloadLogDebug('Completed download', { downloadId, currentDownloadedBytes, totalEncryptedSize });
                },
                onError: async (error) => {
                    handleDownloadError(downloadId, nodes, error, abortController.signal.aborted);
                },
            });
        } catch (error) {
            handleDownloadError(downloadId, nodes, error, abortController.signal.aborted);
        }
    }

    private attachActiveDownload({
        downloadId,
        controller,
        abortController,
        onCompleted,
        onError,
    }: {
        downloadId: string;
        controller: DownloadController;
        abortController: AbortController;
        onCompleted: () => Promise<void>;
        onError: (error: unknown) => Promise<void> | void;
    }): Promise<void> {
        const activeDownload: ActiveDownload = {
            controller,
            abortController,
        };
        this.activeDownloads.set(downloadId, activeDownload);

        const completionPromise = controller
            .completion()
            .then(onCompleted)
            .catch(async (error) => {
                await onError(error);
            })
            .finally(() => {
                this.activeDownloads.delete(downloadId);
            });

        activeDownload.completionPromise = completionPromise;
        return completionPromise;
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
                this.scheduler.cancelDownloadsById(id);
                this.activeDownloads.delete(id);
            } else if (storeItem && this.requestedDownloads.has(id)) {
                downloadLogDebug('Cancel download', { downloadId: id, isPending: true });
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
        this.activeDownloads.clear();
        this.requestedDownloads.clear();
        clearQueue();
    }

    private async stopDownload(downloadIds: string[]) {
        downloadIds.forEach((id) => {
            const active = this.activeDownloads.get(id);
            active?.abortController.abort(new TransferCancel({ id }));
        });
    }

    private updateStatus(downloadIds: string[], status: DownloadItem['status']) {
        const { updateDownloadItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => updateDownloadItem(id, { status }));
    }
}

export const downloadManager = DownloadManager.getInstance();
