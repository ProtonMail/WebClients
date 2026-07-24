import { NodeType } from '@protontech/drive-sdk';

import type { QueueEntry } from '../store/uploadQueue.store';
import { type FolderCreationItem, type UploadItem, UploadStatus } from '../types';

/**
 * Indexes queue items by uploadId so parent lookups are O(1) instead of an
 * O(n) Array.find. Build once per scheduling pass and reuse across lookups.
 */
export function buildItemsById(allItems: QueueEntry[]): Map<string, QueueEntry> {
    const itemsById = new Map<string, QueueEntry>();
    for (const item of allItems) {
        itemsById.set(item.uploadId, item);
    }
    return itemsById;
}

export function isParentReady(item: UploadItem, itemsById: Map<string, QueueEntry>): boolean {
    if (!item.parentUploadId) {
        return true;
    }

    const parent = itemsById.get(item.parentUploadId);
    if (!parent) {
        return true;
    }

    return parent.status === UploadStatus.Finished || (parent.type === NodeType.Folder && !!parent.nodeUid);
}

export function getFolderDepth(folder: FolderCreationItem, itemsById: Map<string, QueueEntry>): number {
    let depth = 0;
    let currentParentUploadId = folder.parentUploadId;

    while (currentParentUploadId) {
        const parentFolder = itemsById.get(currentParentUploadId);

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
