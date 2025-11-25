import { NodeType } from '@proton/drive';
import generateUID from '@proton/utils/generateUID';

import { UploadOrchestrator } from './orchestration/UploadOrchestrator';
import { useUploadControllerStore } from './store/uploadController.store';
import { useUploadQueueStore } from './store/uploadQueue.store';
import { type UploadConflictStrategy, type UploadEvent, UploadStatus } from './types';
import { type FolderNode, buildFolderStructure } from './utils/buildFolderStructure';
import { hasFolderStructure } from './utils/hasFolderStructure';
import { processDroppedItems } from './utils/processDroppedItems';

/**
 * Public API - thin wrapper around orchestrator
 * NO business logic here
 */
export class UploadManager {
    private orchestrator = new UploadOrchestrator();

    /**
     * Only support one onUploadEvent subscription for now
     * TODO: Support multiple with unsubscribe
     */
    onUploadEvent(callback: (event: UploadEvent) => Promise<void>) {
        this.orchestrator.onUploadEvent(callback);
    }

    async upload(files: File[] | FileList, parentUid: string): Promise<void> {
        const queueStore = useUploadQueueStore.getState();
        const batchId = generateUID();
        const filesArray = Array.from(files);

        const hasStructure = hasFolderStructure(filesArray);

        if (!hasStructure) {
            for (const file of filesArray) {
                queueStore.addItem({
                    type: NodeType.File,
                    file,
                    parentUid,
                    name: file.name,
                    uploadedBytes: 0,
                    clearTextExpectedSize: file.size,
                    status: UploadStatus.Pending,
                    batchId,
                });
            }
        } else {
            const rootFolders = this.groupFilesByRootFolder(filesArray);
            for (const rootFiles of rootFolders.values()) {
                const structure = buildFolderStructure(rootFiles);
                this.addFolderStructureToQueue(structure, parentUid, batchId);
            }
        }

        await this.orchestrator.start();
    }

    async uploadDrop(items: DataTransferItemList, fileList: FileList, parentUid: string): Promise<void> {
        const filesEntries = await processDroppedItems(items, fileList);
        await this.upload(filesEntries, parentUid);
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

        queueStore.updateQueueItems(uploadId, {
            status: UploadStatus.Pending,
            error: undefined,
            uploadedBytes: item.type === NodeType.File ? 0 : undefined,
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

    private groupFilesByRootFolder(files: File[]): Map<string, File[]> {
        const rootFolders = new Map<string, File[]>();

        for (const file of files) {
            const relativePath = file.webkitRelativePath || file.name;
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
            queueStore.addItem({
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
        }
    }
}
