import { NodeType, type ProtonDriveClient } from '@protontech/drive-sdk';
import type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';

import generateUID from '@proton/utils/generateUID';

import { UploadDriveClientRegistry } from './UploadDriveClientRegistry';
import { UploadOrchestrator } from './orchestration/UploadOrchestrator';
import { useUploadControllerStore } from './store/uploadController.store';
import { useUploadQueueStore } from './store/uploadQueue.store';
import type { UploadConflictType } from './types';
import { type UploadConflictStrategy, type UploadEvent, UploadStatus } from './types';
import { type FolderNode, buildFolderStructure } from './utils/buildFolderStructure';
import { hasFolderStructure } from './utils/hasFolderStructure';
import { isDataTransferList, processDroppedItems } from './utils/processDroppedItems';

/**
 * Public API - thin wrapper around orchestrator
 * NO business logic here
 */
export class UploadManager {
    private orchestrator = new UploadOrchestrator();
    private activeContexts = new Set<string>();
    private contextUnsubscribers = new Map<string, () => void>();

    /**
     *
     * @deprecated: This is temporary solution to be able to initiate custon client on public page
     * TODO: Implement client per upload.
     * The idea will be to keep the registry but storing client with unique id per upload batch
     * That way we will be able to retrieve the right client during the upload.
     */
    setDriveClient(driveClientInstance: ProtonDriveClient | ProtonDrivePublicLinkClient) {
        UploadDriveClientRegistry.setDriveClient(driveClientInstance);
    }

    /**
     * Set the conflict resolver callback. Can only be set once per app.
     */
    setConflictResolver(
        callback: (
            name: string,
            nodeType: NodeType,
            conflictType: UploadConflictType
        ) => Promise<{ strategy: UploadConflictStrategy; applyToAll: boolean }>
    ): void {
        this.orchestrator.setConflictResolver(callback);
    }

    removeConflictResolver(): void {
        this.orchestrator.removeConflictResolver();
    }

    /**
     * Subscribe to upload events with a specific context.
     * Supports multiple subscriptions from different contexts.
     *
     * @param context - Unique identifier for the subscription context
     * @param callback - Async function called for each upload event
     *
     * @example
     * uploadManager.subscribeToEvents('transfer-manager', async (event) => {
     *   if (event.type === 'file:complete') {
     *     console.log('Upload complete:', event.nodeUid);
     *   }
     * });
     */
    subscribeToEvents(context: string, callback: (event: UploadEvent) => Promise<void>): void {
        if (this.activeContexts.has(context)) {
            return;
        }

        const unsubscribe = this.orchestrator.subscribeToEvents(context, callback);
        this.contextUnsubscribers.set(context, unsubscribe);
        this.activeContexts.add(context);
    }

    /**
     * Unsubscribe from upload events for a specific context.
     *
     * @param context - Unique identifier for the subscription context to remove
     *
     * @example
     * uploadManager.unsubscribeFromEvents('transfer-manager');
     */
    unsubscribeFromEvents(context: string): void {
        const unsubscribe = this.contextUnsubscribers.get(context);
        if (unsubscribe) {
            unsubscribe();
            this.contextUnsubscribers.delete(context);
            this.activeContexts.delete(context);
        }
    }

    /**
     * Check if there are any active subscriptions
     */
    hasSubscriptions(): boolean {
        return this.orchestrator.hasSubscriptions();
    }

    /**
     * Upload files or folders to a parent node in Drive.
     * Automatically detects and preserves folder structures from webkitRelativePath.
     *
     * @param files - Files from file input (File[] | FileList) or drag & drop (DataTransfer)
     * @param parentUid - Parent node UID where files will be uploaded
     * @param fallbackFileList - Optional FileList for browser compatibility with drag & drop
     *
     * @example
     * // From file input
     * await uploadManager.upload(fileInput.files, parentNodeUid);
     *
     * @example
     * // From drag & drop
     * const handleDrop = async (e: React.DragEvent) => {
     *   e.preventDefault();
     *   await uploadManager.upload(e.dataTransfer,parentNodeUid );
     * };
     */
    async upload(filesOrDataTransfer: File[] | FileList | DataTransfer, parentUid: string): Promise<void> {
        await this.processUpload(filesOrDataTransfer, parentUid, false);
    }

    /**
     * Upload photos (no parent node required).
     * Photos uploads are always flat - folder structures are ignored.
     *
     * @param files - Files from file input (File[] | FileList) or drag & drop (DataTransferItemList)
     * @param fallbackFileList - Optional FileList for browser compatibility with drag & drop
     *
     * @example
     * // From file input
     * await uploadManager.uploadPhotos(fileInput.files);
     *
     * @example
     * // From drag & drop
     * const handleDrop = async (e: React.DragEvent) => {
     *   e.preventDefault();
     *   await uploadManager.uploadPhotos(e.dataTransfer);
     * };
     */
    async uploadPhotos(filesOrDataTransfer: File[] | FileList | DataTransfer): Promise<void> {
        await this.processUpload(filesOrDataTransfer, undefined, true);
    }

    private async processUpload(
        filesOrDataTransfer: File[] | FileList | DataTransfer,
        parentUid: string | undefined,
        isForPhotos: boolean
    ): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const batchId = generateUID();

        const filesArray = isDataTransferList(filesOrDataTransfer)
            ? await processDroppedItems(filesOrDataTransfer)
            : Array.from(filesOrDataTransfer);
        const hasStructure = hasFolderStructure(filesArray);

        if (isForPhotos) {
            for (const file of filesArray) {
                const abortController = new AbortController();
                const uploadId = queueStore.addItem({
                    type: NodeType.Photo,
                    file,
                    name: file.name,
                    uploadedBytes: 0,
                    clearTextExpectedSize: file.size,
                    status: UploadStatus.Pending,
                    batchId,
                    isForPhotos,
                });
                this.orchestrator.emitFileQueued(uploadId, true, abortController);
            }
        } else {
            if (!parentUid) {
                // Should never happen
                throw new Error('parentUid is mendatory for non-photos upload, you probably called wrong endpoint');
            }
            if (!hasStructure) {
                for (const file of filesArray) {
                    const abortController = new AbortController();
                    const uploadId = queueStore.addItem({
                        type: NodeType.File,
                        file,
                        parentUid,
                        name: file.name,
                        uploadedBytes: 0,
                        clearTextExpectedSize: file.size,
                        status: UploadStatus.Pending,
                        batchId,
                    });
                    this.orchestrator.emitFileQueued(uploadId, false, abortController);
                }
            } else {
                const { filesWithStructure, standaloneFiles } = this.separateFilesAndFolders(filesArray);

                for (const file of standaloneFiles) {
                    const abortController = new AbortController();
                    const uploadId = queueStore.addItem({
                        type: NodeType.File,
                        file,
                        parentUid,
                        name: file.name,
                        uploadedBytes: 0,
                        clearTextExpectedSize: file.size,
                        status: UploadStatus.Pending,
                        batchId,
                    });
                    this.orchestrator.emitFileQueued(uploadId, false, abortController);
                }

                const rootFolders = this.groupFilesByRootFolder(filesWithStructure);
                for (const rootFiles of rootFolders.values()) {
                    const structure = buildFolderStructure(rootFiles);
                    this.addFolderStructureToQueue(structure, parentUid, batchId);
                }
            }
        }

        await this.orchestrator.start();
    }

    async cancelUpload(uploadId: string): Promise<void> {
        await this.orchestrator.cancel(uploadId);
    }

    retryUpload(uploadId: string): void {
        const queueStore = useUploadQueueStore.getState();
        const item = queueStore.getItem(uploadId);

        if (!item) {
            return;
        }

        const abortController = new AbortController();
        this.orchestrator.emitFileQueued(uploadId, item.type === NodeType.Photo, abortController);

        queueStore.updateQueueItems(uploadId, {
            status: UploadStatus.Pending,
            error: undefined,
            uploadedBytes: item.type === NodeType.File || item.type === NodeType.Photo ? 0 : undefined,
        });

        void this.orchestrator.start();
    }

    async resolveConflict(uploadId: string, strategy: UploadConflictStrategy, applyToAll: boolean = false) {
        const queueStore = useUploadQueueStore.getState();
        const itemOfTheResolution = queueStore.getItem(uploadId);
        if (!itemOfTheResolution) {
            return;
        }
        if (applyToAll) {
            const uploadIds = Array.from(queueStore.queue.values())
                .filter(
                    (queueItem) =>
                        queueItem.status === UploadStatus.ConflictFound &&
                        !queueItem.resolvedStrategy &&
                        queueItem.batchId === itemOfTheResolution.batchId
                )
                .map((queueItem) => queueItem.uploadId);

            await this.orchestrator.chooseConflictStrategy(uploadIds, strategy);
        } else {
            await this.orchestrator.chooseConflictStrategy(uploadId, strategy);
        }
        await this.orchestrator.start();
    }

    clearUploadQueue(): void {
        this.orchestrator.stop();
        this.orchestrator.reset();

        const queueStore = useUploadQueueStore.getState();
        const controllerStore = useUploadControllerStore.getState();

        controllerStore.clearAllControllers();
        queueStore.clearQueue();
    }

    private separateFilesAndFolders(files: File[]): {
        filesWithStructure: File[];
        standaloneFiles: File[];
    } {
        const filesWithStructure: File[] = [];
        const standaloneFiles: File[] = [];

        for (const file of files) {
            const relativePath = file.webkitRelativePath || '';
            const pathSegments = relativePath.split('/').filter((path) => path.length > 0);

            if (pathSegments.length > 1) {
                filesWithStructure.push(file);
            } else {
                standaloneFiles.push(file);
            }
        }

        return { filesWithStructure, standaloneFiles };
    }

    private groupFilesByRootFolder(files: File[]): Map<string, File[]> {
        const rootFolders = new Map<string, File[]>();

        for (const file of files) {
            const relativePath = file.webkitRelativePath || '';
            const rootName = relativePath.split('/')[0];

            if (!rootFolders.has(rootName)) {
                rootFolders.set(rootName, []);
            }
            rootFolders.get(rootName)!.push(file);
        }

        return rootFolders;
    }

    /**
     * Add folder structure to queue
     * Creates root folder and recursively adds subfolders and files
     */
    private addFolderStructureToQueue(structure: FolderNode, parentUid: string, batchId: string): void {
        const queueStore = useUploadQueueStore.getState();
        const folderMap = new Map<string, string>();

        const rootFolderId = queueStore.addItem({
            type: NodeType.Folder,
            name: structure.name,
            parentUid,
            status: UploadStatus.Pending,
            batchId,
        });

        folderMap.set('', rootFolderId);

        this.flattenFolderStructure(structure, parentUid, rootFolderId, '', batchId, folderMap);
    }

    /**
     * Recursively flatten folder tree into queue items
     * Maintains folder path -> uploadId mapping for parent references
     */
    private flattenFolderStructure(
        node: FolderNode,
        parentUid: string,
        parentUploadId: string | undefined,
        currentPath: string,
        batchId: string,
        folderMap: Map<string, string>
    ): void {
        const queueStore = useUploadQueueStore.getState();

        for (const [folderName, subfolder] of node.subfolders) {
            const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

            const uploadId = queueStore.addItem({
                type: NodeType.Folder,
                name: folderName,
                parentUid,
                parentUploadId,
                status: UploadStatus.Pending,
                batchId,
            });

            folderMap.set(folderPath, uploadId);

            this.flattenFolderStructure(subfolder, parentUid, uploadId, folderPath, batchId, folderMap);
        }

        for (const file of node.files) {
            const abortController = new AbortController();
            const uploadId = queueStore.addItem({
                type: NodeType.File,
                file,
                parentUid,
                parentUploadId,
                name: file.name,
                uploadedBytes: 0,
                clearTextExpectedSize: file.size,
                status: UploadStatus.Pending,
                batchId,
            });
            this.orchestrator.emitFileQueued(uploadId, false, abortController);
        }
    }
}
