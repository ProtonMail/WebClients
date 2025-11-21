import { NodeType } from '@protontech/drive-sdk';

import type { QueueEntry } from '../store/uploadQueue.store';
import { type FileUploadItem, type FolderCreationItem, UploadStatus } from '../types';

export function isParentReady(item: FileUploadItem | FolderCreationItem, allItems: QueueEntry[]): boolean {
    if (!item.parentUploadId) {
        return true;
    }

    const parent = allItems.find((entry) => entry.uploadId === item.parentUploadId);
    if (!parent) {
        return true;
    }

    return parent.status === UploadStatus.Finished || (parent.type === NodeType.Folder && !!parent.nodeUid);
}

export function getFolderDepth(folder: FolderCreationItem, allItems: QueueEntry[]): number {
    let depth = 0;
    let currentParentUploadId = folder.parentUploadId;

    while (currentParentUploadId) {
        const parentUploadIdToFind = currentParentUploadId;
        const parentFolder = allItems.find((entry) => entry.uploadId === parentUploadIdToFind);

        if (!parentFolder || parentFolder.type !== NodeType.Folder) {
            break;
        }

        depth++;
        currentParentUploadId = parentFolder.parentUploadId;
    }

    return depth;
}

export function getBlockedChildren(uploadId: string, allItems: QueueEntry[]): string[] {
    return allItems.filter((item) => item.parentUploadId === uploadId).map(({ uploadId }) => uploadId);
}
