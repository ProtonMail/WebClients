import type { NodeEntity, ProtonDriveClient, ProtonDrivePublicLinkClient } from '@proton/drive';
import { NodeType, SDKEvent } from '@proton/drive';
import { TransferSpeedMetrics } from '@proton/drive/internal/performance/transferSpeedMetrics';
import metrics from '@proton/metrics';

import { bufferToStream } from '../../utils/stream';
import { TransferCancel } from '../../utils/transfer';
import { loadCreateReadableStreamWrapper } from '../../utils/webStreamsPolyfill';
import type { DownloadItem } from '../../zustand/download/downloadManager.store';
import {
    DownloadStatus,
    IssueStatus,
    MalwareDownloadResolution,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import { fileSaver } from '../fileSaver/fileSaver';
import ArchiveGenerator from './ArchiveGenerator';
import { ArchiveStreamGenerator } from './ArchiveStreamGenerator';
import { DownloadDriveClientRegistry } from './DownloadDriveClientRegistry';
import { DownloadScheduler } from './DownloadScheduler';
import type { DownloadOptions } from './downloadTypes';
import { MalwareDetection } from './malwareDetection/malwareDetection';
import { createFileDownloadStream } from './utils/createFileDownloadStream';
import { downloadLogDebug } from './utils/downloadLogger';
import { getNodeStorageSize } from './utils/getNodeStorageSize';
import { validateDownloadSignatures } from './utils/handleDownloadCompletion';
import { handleDownloadError } from './utils/handleError';
import { hydrateAndCheckNodes, hydratePhotos } from './utils/hydrateAndCheckNodes';
import { queueDownloadRequest, queueFailedDownloadRequest } from './utils/queueDownloadRequest';
import { traverseNodeStructure } from './utils/traverseNodeStructure';

const DEFAULT_MIME_TYPE = 'application/octet-stream';
/**
 * The timeout is chosen based on trial and error for a good responsivness without overbearing the UI with constant checks
 * If a user knows exactly what the modal is for it takes a second to click on it. Otherwise a few seconds.
 * At the same time if we set it too high you will feel the lag between closing the modal and finishing the transfer.
 */

export type FileDownloader = Awaited<ReturnType<ProtonDriveClient['getFileDownloader']>>;
export type FileRevisionDownloader = Awaited<ReturnType<ProtonDriveClient['getFileRevisionDownloader']>>;
export type DownloadController = ReturnType<FileDownloader['downloadToStream']>;

type ActiveDownload = {
    controller: DownloadController;
    abortController: AbortController;
    completionPromise?: Promise<void>;
};

export class DownloadManager {
    private static instance: DownloadManager | undefined;
    private hasListeners;
    private hasPhotosListeners;
    private scheduler: DownloadScheduler;
    private readonly activeDownloads = new Map<string, ActiveDownload>();
    private requestedDownloads = new Map<string, NodeEntity[]>();
    private readonly malwareDetection: MalwareDetection;
    private readonly downloadSpeedMetrics = new TransferSpeedMetrics((values) => {
        downloadLogDebug('Download speed metrics', values);
        metrics.drive_download_speed_histogram.observe({
            Labels: { context: 'foreground', pipeline: 'default' },
            Value: Math.round(values.kibibytesPerSecond),
        });
    });

    constructor() {
        this.hasListeners = false;
        this.hasPhotosListeners = false;
        this.scheduler = new DownloadScheduler((error, task) =>
            handleDownloadError(task.downloadId, [task.node], error)
        );
        this.malwareDetection = new MalwareDetection();
    }

    static getInstance(): DownloadManager {
        if (!DownloadManager.instance) {
            DownloadManager.instance = new DownloadManager();
        }

        return DownloadManager.instance;
    }

    /**
     *
     * @deprecated: This is temporary solution to be able to initiate custon client on public page
     * TODO: Implement client per download.
     * The idea will be to keep the registry but storing client with unique id per download batch
     * That way we will be able to retrieve the right client during the download.
     */
    setDriveClient(driveClientInstance: ProtonDriveClient | ProtonDrivePublicLinkClient) {
        DownloadDriveClientRegistry.setDriveClient(driveClientInstance);
    }

    resolveSignatureIssue(item: DownloadItem, issueName: string, decision: IssueStatus, applyAll?: boolean) {
        const { updateDownloadItem, updateSignatureIssueStatus } = useDownloadManagerStore.getState();

        if (applyAll) {
            updateDownloadItem(item.downloadId, { signatureIssueAllDecision: decision });
        }
        updateSignatureIssueStatus(item.downloadId, issueName, decision);
    }

    addListeners() {
        if (this.hasListeners) {
            return;
        }
        this.hasListeners = true;
        const { getQueueItem } = useDownloadManagerStore.getState();
        const drive = DownloadDriveClientRegistry.getDriveClient();
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

    addPhotosListeners() {
        if (this.hasPhotosListeners) {
            return;
        }
        this.hasPhotosListeners = true;
        const { getQueueItem } = useDownloadManagerStore.getState();
        const drivePhotos = DownloadDriveClientRegistry.getDrivePhotosClient();

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

    async downloadRevision(nodeUid: string, revisionUid: string) {
        return this.processDownload([nodeUid], { revisionUid });
    }

    async download(nodeUids: string[], options: DownloadOptions = {}) {
        return this.processDownload(nodeUids, options);
    }

    async downloadAndScan(nodeUids: string[], options: DownloadOptions = {}) {
        return this.processDownload(nodeUids, { shouldScanForMalware: true, ...options });
    }

    async downloadPhotos(nodeUids: string[], albumName?: string) {
        return this.processDownload(nodeUids, { isPhoto: true, albumName });
    }

    // TODO: Add possibility to just pass the uid instead of whole node
    async downloadFromBuffer(node: NodeEntity, buffer: Uint8Array<ArrayBuffer>[], mimeType?: string) {
        const stream = bufferToStream(buffer);
        const storageSize = getNodeStorageSize(node);

        const { addDownloadItem } = useDownloadManagerStore.getState();
        const downloadId = addDownloadItem({
            name: node.name,
            storageSize,
            status: DownloadStatus.Finished,
            nodeUids: [node.uid],
            downloadedBytes: storageSize,
            isPhoto: false,
        });

        await fileSaver.saveAsFile(stream, {
            downloadId,
            filename: node.name,
            mimeType: mimeType ?? DEFAULT_MIME_TYPE,
        });
    }

    private async processDownload(nodeUids: string[], options: DownloadOptions = {}) {
        if (!nodeUids.length) {
            return;
        }

        const isPhotoDownload = !!options.isPhoto;
        let nodes: NodeEntity[] = [];
        let containsUnsupportedFile: boolean | undefined;
        try {
            if (isPhotoDownload) {
                ({ nodes, containsUnsupportedFile } = await hydratePhotos(nodeUids));
                this.addPhotosListeners();
            } else {
                ({ nodes, containsUnsupportedFile } = await hydrateAndCheckNodes(nodeUids));
                this.addListeners();
            }
        } catch (error) {
            // hydrate can throw error if node is missing, in this case we add the failed entry in store
            const downloadId = queueFailedDownloadRequest({
                nodes,
                requestedDownloads: this.requestedDownloads,
            });
            if (downloadId) {
                handleDownloadError(downloadId, nodes, error);
            }
        }

        if (!nodes.length) {
            return;
        }

        const downloadId = queueDownloadRequest({
            nodes,
            isPhoto: isPhotoDownload,
            containsUnsupportedFile,
            requestedDownloads: this.requestedDownloads,
            scheduleSingleFile: (id, node) => this.scheduleSingleFileDownload(id, node),
            scheduleArchive: (id, queuedNodes) => this.scheduleArchiveDownload(id, queuedNodes),
            getArchiveName: (items) => this.getArchiveName(items),
            ...options,
        });
        if (!downloadId) {
            return;
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

    /**
     * Called from the consumer to resolve the Malaware decision with user choice from the UI
     */
    setMalawareDecision(downloadId: string, decision: IssueStatus) {
        this.malwareDetection.resolveDecision(downloadId, decision);
        downloadLogDebug('Malware decision', { downloadId, decision });
    }

    private async startSingleFileDownload(node: NodeEntity, downloadId: string): Promise<void> {
        const { updateDownloadItem, getQueueItem } = useDownloadManagerStore.getState();

        const abortController = new AbortController();
        let completionPromise: Promise<void>;
        let currentDownloadedBytes = 0;

        try {
            const storageSize = getNodeStorageSize(node);
            updateDownloadItem(downloadId, { storageSize: storageSize, status: DownloadStatus.InProgress });
            this.downloadSpeedMetrics.onFileStarted(downloadId);

            const { stream, controller, closeWriter, abortWriter } = await createFileDownloadStream({
                downloadId,
                node,
                abortSignal: abortController.signal,
                onProgress: (downloadedBytes) => {
                    currentDownloadedBytes = downloadedBytes;
                    updateDownloadItem(downloadId, { downloadedBytes });
                    this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
                    const isPaused =
                        getQueueItem(downloadId)?.status === DownloadStatus.Paused ||
                        getQueueItem(downloadId)?.status === DownloadStatus.PausedServer;
                    this.downloadSpeedMetrics.onFileProgress(downloadId, downloadedBytes, isPaused);
                },
                malwareDetection: this.malwareDetection,
            });

            const streamWrapperPromise = loadCreateReadableStreamWrapper(stream);

            const savePromise = streamWrapperPromise.then((streamForSaver) =>
                fileSaver.saveAsFile(streamForSaver, {
                    downloadId,
                    filename: node.name,
                    mimeType: DEFAULT_MIME_TYPE,
                    size: storageSize,
                })
            );

            const abortSaving = async (reason?: unknown) => {
                abortWriter(reason);
                const streamForSaver = await streamWrapperPromise;
                if (!streamForSaver.locked) {
                    await streamForSaver.cancel(reason);
                }
                await savePromise.catch(() => undefined);
            };

            await validateDownloadSignatures({
                downloadId,
                node,
                controller,
                onApproved: closeWriter,
                onRejected: () => {
                    throw new TransferCancel({ id: downloadId });
                },
                onError: abortSaving,
            });

            completionPromise = this.attachActiveDownload({
                downloadId,
                controller,
                abortController,
                onCompleted: async () => {
                    try {
                        await savePromise;
                    } catch (error) {
                        await abortSaving(error);
                        handleDownloadError(downloadId, [node], error);
                    }
                    // At the moment images storageSize mistakenly includes the thumbnail, to avoid progress showing <100%
                    // we force the downloaded size to match the storage size until this is fixed
                    updateDownloadItem(downloadId, { status: DownloadStatus.Finished, downloadedBytes: storageSize });
                    downloadLogDebug('Completed download', { downloadId, currentDownloadedBytes, storageSize });
                },
                onError: async (error) => {
                    await abortSaving(error);
                    handleDownloadError(downloadId, [node], error);
                },
            });
        } catch (error) {
            this.downloadSpeedMetrics.onFileEnded(downloadId);
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
            this.downloadSpeedMetrics.onFileStarted(downloadId);

            void traversalCompletedPromise.then((traversalResult) => {
                downloadLogDebug('Archive traversal complete', traversalResult);
                totalEncryptedSize = traversalResult.totalEncryptedSize;
                updateDownloadItem(downloadId, {
                    storageSize: totalEncryptedSize,
                    status: DownloadStatus.InProgress,
                    unsupportedFileDetected: traversalResult.containsUnsupportedFile ? IssueStatus.Detected : undefined,
                });
            });

            const updateProgress = (downloadedBytes: number) => {
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
                currentDownloadedBytes = downloadedBytes;
                const isPaused =
                    getQueueItem(downloadId)?.status === DownloadStatus.Paused ||
                    getQueueItem(downloadId)?.status === DownloadStatus.PausedServer;
                this.downloadSpeedMetrics.onFileProgress(downloadId, downloadedBytes, isPaused);
            };

            const archiveGenerator = new ArchiveGenerator();
            const archiveStreamGenerator = new ArchiveStreamGenerator({
                entries: nodesQueue.iterator(),
                onProgress: updateProgress,
                scheduler: this.scheduler,
                abortController,
                parentPathByUid,
                downloadId,
                malwareDetection: this.malwareDetection,
            });
            const generator = archiveStreamGenerator.generator;
            const trackerController = archiveStreamGenerator.controller;

            abortController.signal.addEventListener('abort', () => archiveGenerator.cancel());

            const waitForFirstItemPromise = archiveStreamGenerator.waitForFirstItem();

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

            const savingPromise = (async () => {
                await waitForFirstItemPromise;
                const savePromise = fileSaver.saveAsFile(archiveGenerator.stream, {
                    downloadId,
                    filename: archiveName,
                    mimeType: 'application/zip',
                    size: totalEncryptedSize > 0 ? totalEncryptedSize : undefined,
                });

                if (abortController.signal.aborted || archiveStreamGenerator.lastError) {
                    // Super important that we don't save the file if cancelled or erroring
                    return;
                }
                await savePromise;

                downloadLogDebug('Archive saveAsFile (buffer) done', { downloadId });
            })();

            const combinedPromise = Promise.all([archivePromise, savingPromise]).then(() => {});

            const controllerProxy: DownloadController = {
                pause: () => trackerController.pause(),
                resume: () => trackerController.resume(),
                completion: () => combinedPromise,
                isDownloadCompleteWithSignatureIssues: () =>
                    archiveStreamGenerator.controller.isDownloadCompleteWithSignatureIssues(),
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
            this.downloadSpeedMetrics.onFileEnded(downloadId);
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
        malwareDecision?: Promise<IssueStatus>;
    }): Promise<void> {
        const activeDownload: ActiveDownload = { controller, abortController };
        this.activeDownloads.set(downloadId, activeDownload);

        const completionPromise = controller
            .completion()
            .then(onCompleted)
            .catch(async (error) => {
                await onError(error);
            })
            .finally(() => {
                this.activeDownloads.delete(downloadId);
                this.downloadSpeedMetrics.onFileEnded(downloadId);
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

    resolveMalwareDetection(downloadId: string, resolution: MalwareDownloadResolution) {
        if (resolution === MalwareDownloadResolution.CancelDownload) {
            this.cancel([downloadId]);
        }
        if (resolution === MalwareDownloadResolution.ContinueDownload) {
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
        const { getQueueItem, updateDownloadItem } = useDownloadManagerStore.getState();
        downloadIds.forEach((id) => {
            const storeItem = getQueueItem(id);
            const requestedDownload = this.requestedDownloads.get(id);
            if (storeItem && requestedDownload) {
                downloadLogDebug('Retry download', { downloadId: id });
                updateDownloadItem(id, { isRetried: true });
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
            this.downloadSpeedMetrics.onFileEnded(id);
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
