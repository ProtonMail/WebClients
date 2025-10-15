import type { NodeEntity } from '@proton/drive';
import { NodeType, getDrive } from '@proton/drive/index';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getLegacyModifiedTime } from '../../../utils/sdk/legacyTime';
import type { DownloadableItem } from '../downloadTypes';
import { type AsyncQueue, createAsyncQueue } from './asyncQueue';

export type ArchiveTraversalResult = {
    nodesQueue: AsyncQueue<DownloadableItem>;
    totalEncryptedSizePromise: Promise<number>;
};

/**
 * This function will traverse nodes, fetch them using the sdk and get all nodes inside folders recursively
 * the main info we need for each node are parentPath and size
 */
export function nodesStructureTraversal(nodes: DownloadableItem[], signal: AbortSignal): ArchiveTraversalResult {
    const fetchQueue = createAsyncQueue<DownloadableItem>();
    const nodesQueue = createAsyncQueue<DownloadableItem>();
    const drive = getDrive();

    let pendingFetchTasks = 0;
    let archiveStorageSizeInBytes = 0;

    const enqueueForFetch = (entry: DownloadableItem) => {
        pendingFetchTasks += 1;
        fetchQueue.push(entry);
    };

    nodes.forEach((node) => enqueueForFetch(normalizeDownloadableItem(node)));

    const totalEncryptedSizePromise = (async () => {
        try {
            for await (const entry of fetchQueue.iterator()) {
                pendingFetchTasks -= 1;
                nodesQueue.push(entry);

                if (!entry.isFile) {
                    const childrenParentPath = [...(entry.parentPath ?? []), entry.name];
                    for await (const maybeNode of drive.iterateFolderChildren(entry.uid, undefined, signal)) {
                        const { node } = getNodeEntity(maybeNode);
                        const childEntry = createDownloadableItem(node, childrenParentPath);
                        archiveStorageSizeInBytes += node.activeRevision?.storageSize ?? 0;
                        enqueueForFetch(childEntry);
                    }
                }
                if (pendingFetchTasks === 0) {
                    fetchQueue.close();
                }
            }

            nodesQueue.close();
            fetchQueue.close();
            return archiveStorageSizeInBytes;
        } catch (error) {
            fetchQueue.close();
            nodesQueue.error(error);
            throw error;
        }
    })();

    return { nodesQueue, totalEncryptedSizePromise };
}

function createDownloadableItem(node: NodeEntity, parentPath: string[]): DownloadableItem {
    const isFile = node.type === NodeType.File;
    const storageSize = node.activeRevision?.storageSize;
    const fileModifyTime = isFile ? getLegacyModifiedTime(node) : undefined;

    return {
        uid: node.uid,
        name: node.name,
        isFile,
        parentPath: [...parentPath],
        storageSize,
        fileModifyTime,
    };
}

function normalizeDownloadableItem(item: DownloadableItem): DownloadableItem {
    return {
        ...item,
        parentPath: item.parentPath ? [...item.parentPath] : [],
        storageSize: item.storageSize ?? 0,
    };
}
