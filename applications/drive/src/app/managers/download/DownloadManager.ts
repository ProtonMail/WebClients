import type { NodeEntity, ProtonDriveClient, ProtonDrivePublicLinkClient } from '@proton/drive';
import { NodeType, SDKEvent } from '@proton/drive';

import { bufferToStream } from '../../utils/stream';
import { TransferCancel } from '../../utils/transfer';
import { loadCreateReadableStreamWrapper } from '../../utils/webStreamsPolyfill';
import type { DownloadItem } from '../../zustand/download/downloadManager.store';
import {
    DownloadStatus,
    IssueStatus,
    MalawareDownloadResolution,
    useDownloadManagerStore,
} from '../../zustand/download/downloadManager.store';
import { fileSaver } from '../fileSaver/fileSaver';
import ArchiveGenerator from './ArchiveGenerator';
import { ArchiveStreamGenerator } from './ArchiveStreamGenerator';
import { DownloadDriveClientRegistry } from './DownloadDriveClientRegistry';
import { DownloadScheduler } from './DownloadScheduler';
import { downloadLogDebug } from './utils/downloadLogger';
import { getDownloadSdk } from './utils/getDownloadSdk';
import { getNodeStorageSize } from './utils/getNodeStorageSize';
import { handleDownloadError } from './utils/handleError';
import { hydrateAndCheckNodes, hydratePhotos } from './utils/hydrateAndCheckNodes';
import { queueDownloadRequest } from './utils/queueDownloadRequest';
import {
    addAndWaitForManifestIssueDecision,
    addAndWaitForMetadataIssueDecision,
    detectMetadataSignatureIssue,
} from './utils/signatureIssues';
import { traverseNodeStructure } from './utils/traverseNodeStructure';

const DEFAULT_MIME_TYPE = 'application/octet-stream';
/**
 * The timeout is chosen based on trial and error for a good responsivness without overbearing the UI with constant checks
 * If a user knows exactly what the modal is for it takes a second to click on it. Otherwise a few seconds.
 * At the same time if we set it too high you will feel the lag between closing the modal and finishing the transfer.
 */

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
    private hasPhotosListeners;
    private scheduler: DownloadScheduler;
    private readonly activeDownloads = new Map<string, ActiveDownload>();
    private requestedDownloads = new Map<string, NodeEntity[]>();

    constructor() {
        this.hasListeners = false;
        this.hasPhotosListeners = false;
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

    async downloadPhotos(nodeUids: string[], albumName?: string) {
        if (!nodeUids.length) {
            return;
        }
        const { nodes } = await hydratePhotos(nodeUids);
        if (!nodes.length) {
            return;
        }
        const { addDownloadItem } = useDownloadManagerStore.getState();
        this.addPhotosListeners();

        const downloadId = queueDownloadRequest({
            nodes,
            isPhoto: true,
            albumName,
            addDownloadItem,
            requestedDownloads: this.requestedDownloads,
            scheduleSingleFile: (id, node) => this.scheduleSingleFileDownload(id, node),
            scheduleArchive: (id, queuedNodes) => this.scheduleArchiveDownload(id, queuedNodes),
            getArchiveName: (items) => this.getArchiveName(items),
        });
        if (!downloadId) {
            return;
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

        const downloadId = queueDownloadRequest({
            nodes,
            isPhoto: false,
            containsUnsupportedFile,
            addDownloadItem,
            requestedDownloads: this.requestedDownloads,
            scheduleSingleFile: (id, node) => this.scheduleSingleFileDownload(id, node),
            scheduleArchive: (id, queuedNodes) => this.scheduleArchiveDownload(id, queuedNodes),
            getArchiveName: (items) => this.getArchiveName(items),
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

            const transformStream = new TransformStream<Uint8Array<ArrayBuffer>>();
            const streamWriter = transformStream.writable.getWriter();
            const streamWrapperPromise = loadCreateReadableStreamWrapper(transformStream.readable);
            let writerClosed = false;

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

            const savePromise = streamWrapperPromise.then((streamForSaver) =>
                fileSaver.saveAsFile(streamForSaver, {
                    downloadId,
                    filename: node.name,
                    mimeType: DEFAULT_MIME_TYPE,
                    size: storageSize,
                })
            );

            const abortSaving = async (reason?: unknown) => {
                await streamWriter.abort(reason);
                const streamForSaver = await streamWrapperPromise;
                if (!streamForSaver.locked) {
                    await streamForSaver.cancel(reason);
                }
                await savePromise.catch(() => undefined);
            };

            const controller = fileDownloader.downloadToStream(writableForDownloader, (downloadedBytes) => {
                currentDownloadedBytes = downloadedBytes;
                updateDownloadItem(downloadId, { downloadedBytes });
                this.scheduler.updateDownloadProgress(downloadId, downloadedBytes);
            });

            try {
                const metadataIssueLocation = detectMetadataSignatureIssue(node);
                if (metadataIssueLocation !== undefined) {
                    const decision = await addAndWaitForMetadataIssueDecision(downloadId, node, metadataIssueLocation);
                    if (decision === IssueStatus.Approved) {
                        await controller.completion();
                    } else {
                        // This is user cancellation
                        void streamWriter.abort(new TransferCancel({ id: downloadId }));
                    }
                } else {
                    await controller.completion();
                }
            } catch (error) {
                if (controller.isDownloadCompleteWithSignatureIssues()) {
                    const decision = await addAndWaitForManifestIssueDecision(downloadId, node);
                    writerClosed = true;
                    if (decision === IssueStatus.Approved) {
                        void streamWriter.close();
                    } else {
                        // This is user cancellation
                        void streamWriter.abort(new TransferCancel({ id: downloadId }));
                    }
                } else {
                    await writableForDownloader.abort(error);
                }
            } finally {
                if (!writerClosed) {
                    streamWriter.close().catch(() => {
                        downloadLogDebug('Download error on closing streamWriter', { downloadId });
                    });
                }
            }

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
                    unsupportedFileDetected: traversalResult.containsUnsupportedFile ? IssueStatus.Detected : undefined,
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
                abortController,
                parentPathByUid,
                downloadId,
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
