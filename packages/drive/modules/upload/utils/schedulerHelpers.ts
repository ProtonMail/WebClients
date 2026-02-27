import { NodeType } from '@protontech/drive-sdk';

import type { QueueEntry } from '../store/uploadQueue.store';
import type { FileUploadItems, FolderCreationItem, SchedulerLoad, UploadTask } from '../types';
import { UploadStatus, isPhotosUploadItem } from '../types';
import { getFolderDepth, isParentReady } from './dependencyHelpers';

function getReadyFolderTasks(queueItems: QueueEntry[], maxCount: number): UploadTask[] {
    const readyFolders = queueItems
        .filter((entry): entry is FolderCreationItem => {
            return (
                entry.type === NodeType.Folder &&
                entry.status === UploadStatus.Pending &&
                isParentReady(entry, queueItems)
            );
        })
        // Sort by depth for parent-first creation
        .sort((a, b) => {
            const depthA = getFolderDepth(a, queueItems);
            const depthB = getFolderDepth(b, queueItems);
            return depthA - depthB;
        })
        .slice(0, maxCount);

    return readyFolders.map((entry) => ({
        uploadId: entry.uploadId,
        type: NodeType.Folder,
        name: entry.name,
        parentUid: entry.parentUid,
        batchId: entry.batchId,
        modificationTime: entry.modificationTime,
    }));
}

function getReadyFileTasks(queueItems: QueueEntry[], maxCount: number): UploadTask[] {
    const readyFiles = queueItems
        .filter((entry): entry is FileUploadItems => {
            return (
                (entry.type === NodeType.File || entry.type === NodeType.Photo) &&
                entry.status === UploadStatus.Pending &&
                isParentReady(entry, queueItems)
            );
        })
        .slice(0, maxCount);

    return readyFiles.map((entry): UploadTask => {
        if (isPhotosUploadItem(entry)) {
            return {
                uploadId: entry.uploadId,
                type: NodeType.Photo,
                name: entry.name,
                batchId: entry.batchId,
                file: entry.file,
                sizeEstimate: entry.clearTextExpectedSize,
                existingNodeUid: entry.existingNodeUid,
                isUnfinishedUpload: entry.isUnfinishedUpload,
                isForPhotos: true,
            };
        }

        return {
            uploadId: entry.uploadId,
            type: NodeType.File,
            name: entry.name,
            parentUid: entry.parentUid,
            batchId: entry.batchId,
            file: entry.file,
            sizeEstimate: entry.clearTextExpectedSize,
            existingNodeUid: entry.existingNodeUid,
            isUnfinishedUpload: entry.isUnfinishedUpload,
        };
    });
}

export function getNextTasks(
    queueItems: QueueEntry[],
    currentLoad: SchedulerLoad,
    maxConcurrentFiles: number,
    maxConcurrentFolders: number
): UploadTask[] {
    const tasks: UploadTask[] = [];

    const availableFolderSlots = maxConcurrentFolders - currentLoad.activeFolders;
    if (availableFolderSlots > 0) {
        const folderTasks = getReadyFolderTasks(queueItems, availableFolderSlots);
        tasks.push(...folderTasks);
    }

    const availableFileSlots = maxConcurrentFiles - currentLoad.activePreparingFiles;
    if (availableFileSlots > 0) {
        const fileTasks = getReadyFileTasks(queueItems, availableFileSlots);
        tasks.push(...fileTasks);
    }

    return tasks;
}
