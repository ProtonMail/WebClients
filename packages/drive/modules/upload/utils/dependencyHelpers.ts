import { NodeType } from '@protontech/drive-sdk';

import type { QueueEntry } from '../store/uploadQueue.store';
import { type FolderCreationItem, type UploadItem, UploadStatus, isTerminalStatus } from '../types';

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

export function getDirectChildren(uploadId: string, allItems: QueueEntry[]): string[] {
    return allItems.filter((item) => item.parentUploadId === uploadId).map(({ uploadId }) => uploadId);
}

/**
 * Children, grandchildren, and so on. A folder that is cancelled, skipped or failed
 * blocks its whole sub-tree, not only the items right under it.
 */
export function getAllDescendants(rootIds: string[], allItems: QueueEntry[]): string[] {
    const childIdsByParentId = new Map<string, string[]>();
    for (const item of allItems) {
        if (!item.parentUploadId) {
            continue;
        }
        const siblingIds = childIdsByParentId.get(item.parentUploadId);
        if (siblingIds) {
            siblingIds.push(item.uploadId);
        } else {
            childIdsByParentId.set(item.parentUploadId, [item.uploadId]);
        }
    }

    // The roots start as seen so they never show up as their own descendants, and a corrupted
    // queue with a parent cycle stops instead of looping forever.
    const seenIds = new Set(rootIds);
    const idsToExplore = [...rootIds];
    const descendantIds: string[] = [];

    for (let exploreIndex = 0; exploreIndex < idsToExplore.length; exploreIndex++) {
        for (const childId of childIdsByParentId.get(idsToExplore[exploreIndex]) ?? []) {
            if (seenIds.has(childId)) {
                continue;
            }
            seenIds.add(childId);
            idsToExplore.push(childId);
            descendantIds.push(childId);
        }
    }

    return descendantIds;
}

/**
 * Descendants that still need to be blocked when their parent is cancelled, skipped or failed.
 * Items already in a terminal status keep it: a file that finished uploading exists on the server,
 * marking it as cancelled would lie to the user.
 *
 * The filtering happens after the walk on purpose. Terminal items are still traversed, so pending
 * items sitting under an already finished sub-folder are found and blocked.
 */
export function getBlockedDescendants(rootIds: string[], allItems: QueueEntry[]): string[] {
    const itemsById = buildItemsById(allItems);

    return getAllDescendants(rootIds, allItems).filter(
        (descendantId) => !isTerminalStatus(itemsById.get(descendantId)?.status)
    );
}
