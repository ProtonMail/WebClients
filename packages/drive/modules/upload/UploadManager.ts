import { NodeType, type ProtonDriveClient } from '@protontech/drive-sdk';
import type { ProtonDrivePublicLinkClient } from '@protontech/drive-sdk/dist/protonDrivePublicLinkClient';

import generateUID from '@proton/utils/generateUID';

import { UploadDriveClientRegistry } from './UploadDriveClientRegistry';
import { UploadOrchestrator } from './orchestration/UploadOrchestrator';
import { useUploadControllerStore } from './store/uploadController.store';
import { type UploadItemInput, useUploadQueueStore } from './store/uploadQueue.store';
import type { UploadConflictType, UploadEventSubscriberCallback } from './types';
import { EmptyFileDecision, type UploadConflictStrategy, UploadStatus } from './types';
import { type FolderNode, buildFolderStructure } from './utils/buildFolderStructure';
import { hasFolderStructure } from './utils/hasFolderStructure';
import { isEmptyFolderPlaceholder } from './utils/isEmptyFolderPlaceholder';
import { isDataTransferList, processDroppedItems } from './utils/processDroppedItems';

type FileQueueEntry = { uploadId: string; abortController: AbortController };

/**
 * Public API - thin wrapper around orchestrator
 * NO business logic here
 */
export class UploadManager {
    private orchestrator = new UploadOrchestrator();
    private activeContexts = new Set<string>();
    private contextUnsubscribers = new Map<string, () => void>();
    // A resolver to capture the user decision about uploading "zero bytes" files:
    // Either skip them (and upload other non-zero files), upload anyway or cancel the whole upload operation.
    private emptyFileResolver: ((fileNames: string[]) => Promise<EmptyFileDecision>) | undefined;

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

    setEmptyFileResolver(callback: (fileNames: string[]) => Promise<EmptyFileDecision>): void {
        this.emptyFileResolver = callback;
    }

    removeEmptyFileResolver(): void {
        this.emptyFileResolver = undefined;
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
    subscribeToEvents(context: string, callback: UploadEventSubscriberCallback): void {
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
    // TODO: returning list of uploadIds is a temporary way to follow upload lifecycle in clients
    // We need to think of an optimal way of handling that
    async uploadPhotos(filesOrDataTransfer: File[] | FileList | DataTransfer): Promise<string[]> {
        return this.processUpload(filesOrDataTransfer, undefined, true);
    }

    private async processUpload(
        filesOrDataTransfer: File[] | FileList | DataTransfer,
        parentUid: string | undefined,
        isForPhotos: boolean
    ): Promise<string[]> {
        const batchId = generateUID();

        const filesArray = isDataTransferList(filesOrDataTransfer)
            ? await processDroppedItems(filesOrDataTransfer, { skipEmptyFolders: isForPhotos })
            : Array.from(filesOrDataTransfer);

        const isEmptyFile = (f: File) => f.size === 0 && !isEmptyFolderPlaceholder(f);
        const emptyFiles = filesArray.filter(isEmptyFile);
        const confirmedEmptyFiles = new Set<File>();
        if (emptyFiles.length > 0 && this.emptyFileResolver) {
            const result = await this.emptyFileResolver(emptyFiles.map((f) => f.name));
            if (result === EmptyFileDecision.Cancel) {
                return [];
            }
            if (result === EmptyFileDecision.Allow) {
                emptyFiles.forEach((f) => confirmedEmptyFiles.add(f));
            }
        }
        const filteredFilesArray = filesArray.filter((f) => {
            if (isEmptyFile(f) && this.emptyFileResolver) {
                return confirmedEmptyFiles.has(f);
            }
            return true;
        });

        const hasStructure = hasFolderStructure(filteredFilesArray);
        const queuedUploadIds: string[] = [];
        if (isForPhotos) {
            queuedUploadIds.push(
                ...this.queueFiles(
                    filteredFilesArray,
                    (file, uploadId) => ({
                        type: NodeType.Photo,
                        uploadId,
                        file,
                        name: file.name,
                        uploadedBytes: 0,
                        clearTextExpectedSize: file.size,
                        status: UploadStatus.Pending,
                        batchId,
                        isForPhotos,
                        allowEmptyFile: confirmedEmptyFiles.has(file),
                    }),
                    true
                )
            );
        } else {
            if (!parentUid) {
                // Should never happen
                throw new Error('parentUid is mandatory for non-photos upload, you probably called wrong endpoint');
            }

            const makeFileItem = (file: File, uploadId: string): UploadItemInput => ({
                type: NodeType.File,
                uploadId,
                file,
                parentUid,
                name: file.name,
                uploadedBytes: 0,
                clearTextExpectedSize: file.size,
                status: UploadStatus.Pending,
                batchId,
                allowEmptyFile: confirmedEmptyFiles.has(file),
            });

            if (!hasStructure) {
                queuedUploadIds.push(...this.queueFiles(filteredFilesArray, makeFileItem, false));
            } else {
                const { filesWithStructure, standaloneFiles } = this.separateFilesAndFolders(filteredFilesArray);

                queuedUploadIds.push(...this.queueFiles(standaloneFiles, makeFileItem, false));

                const rootFolders = this.groupFilesByRootFolder(filesWithStructure);
                for (const rootFiles of rootFolders.values()) {
                    const structure = buildFolderStructure(rootFiles);
                    this.addFolderStructureToQueue(structure, parentUid, batchId, confirmedEmptyFiles);
                }
            }
        }

        void this.orchestrator.start();
        return queuedUploadIds;
    }

    /**
     * Builds queue items and abort controllers for a flat list of files, then
     * commits them to the queue in a single batched update.
     */
    private queueFiles(
        files: File[],
        makeItem: (file: File, uploadId: string) => UploadItemInput,
        isForPhotos: boolean
    ): string[] {
        const items: UploadItemInput[] = [];
        const fileQueue: FileQueueEntry[] = [];

        for (const file of files) {
            const uploadId = generateUID();
            items.push(makeItem(file, uploadId));
            fileQueue.push({ uploadId, abortController: new AbortController() });
        }

        this.commitFileQueue(items, fileQueue, isForPhotos);
        return fileQueue.map((entry) => entry.uploadId);
    }

    /**
     * Cancel one or many uploads in a single store update.
     */
    cancel(uploadIds: string[]): void {
        this.orchestrator.cancel(uploadIds);
    }

    retryUpload(uploadId: string): void {
        const queueStore = useUploadQueueStore.getState();
        const item = queueStore.getItem(uploadId);

        if (!item) {
            return;
        }

        const abortController = new AbortController();
        useUploadControllerStore.getState().setAbortControllers(new Map([[uploadId, abortController]]));
        this.orchestrator.emitFileQueued(uploadId, item.type === NodeType.Photo);

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
            rootFolders.get(rootName)?.push(file);
        }

        return rootFolders;
    }

    /**
     * Add folder structure to queue
     * Creates root folder and recursively adds subfolders and files
     */
    private addFolderStructureToQueue(
        structure: FolderNode,
        parentUid: string,
        batchId: string,
        confirmedEmptyFiles: Set<File>
    ): void {
        const folderMap = new Map<string, string>();
        const items: UploadItemInput[] = [];
        const fileQueue: FileQueueEntry[] = [];

        const rootFolderId = generateUID();
        items.push({
            type: NodeType.Folder,
            uploadId: rootFolderId,
            name: structure.name,
            parentUid,
            status: UploadStatus.Pending,
            batchId,
        });

        folderMap.set('', rootFolderId);

        this.flattenFolderStructure(
            structure,
            parentUid,
            rootFolderId,
            '',
            batchId,
            folderMap,
            items,
            fileQueue,
            confirmedEmptyFiles
        );

        this.commitFileQueue(items, fileQueue, false);
    }

    /**
     * Inserts queued folders/files into the queue store and registers their abort
     * controllers, each in a single batched update, then emits one file:queued
     * event per file. Batching avoids a full store copy per item when queuing many
     * files at once (e.g. a large folder upload).
     */
    private commitFileQueue(items: UploadItemInput[], fileQueue: FileQueueEntry[], isForPhotos: boolean): void {
        useUploadQueueStore.getState().addItems(items);
        useUploadControllerStore
            .getState()
            .setAbortControllers(
                new Map(fileQueue.map(({ uploadId, abortController }) => [uploadId, abortController]))
            );

        for (const { uploadId } of fileQueue) {
            this.orchestrator.emitFileQueued(uploadId, isForPhotos);
        }
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
        folderMap: Map<string, string>,
        items: UploadItemInput[],
        fileQueue: FileQueueEntry[],
        confirmedEmptyFiles: Set<File>
    ): void {
        for (const [folderName, subfolder] of node.subfolders) {
            const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            const uploadId = generateUID();

            items.push({
                type: NodeType.Folder,
                uploadId,
                name: folderName,
                parentUid,
                parentUploadId,
                status: UploadStatus.Pending,
                batchId,
            });

            folderMap.set(folderPath, uploadId);

            this.flattenFolderStructure(
                subfolder,
                parentUid,
                uploadId,
                folderPath,
                batchId,
                folderMap,
                items,
                fileQueue,
                confirmedEmptyFiles
            );
        }

        for (const file of node.files) {
            const abortController = new AbortController();
            const uploadId = generateUID();
            items.push({
                type: NodeType.File,
                uploadId,
                file,
                parentUid,
                parentUploadId,
                name: file.name,
                uploadedBytes: 0,
                clearTextExpectedSize: file.size,
                status: UploadStatus.Pending,
                batchId,
                allowEmptyFile: confirmedEmptyFiles.has(file),
            });
            fileQueue.push({ uploadId, abortController });
        }
    }
}
