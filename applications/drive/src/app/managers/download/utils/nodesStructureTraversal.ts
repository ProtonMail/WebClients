import type { NodeEntity } from '@proton/drive';
import { NodeType, getDrive } from '@proton/drive/index';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import type { AsyncQueue } from './asyncQueue';
import { createAsyncQueue } from './asyncQueue';

export type ArchiveTraversalResult = {
    nodesQueue: AsyncQueue<NodeEntity>;
    totalEncryptedSizePromise: Promise<number>;
    parentPathByUid: Map<string, string[]>;
};

/**
 * Traverse the provided nodes, enqueueing them for archive generation and calculating total size.
 */
export function nodesStructureTraversal(nodes: NodeEntity[], signal: AbortSignal): ArchiveTraversalResult {
    const fetchQueue = createAsyncQueue<NodeEntity>();
    const nodesQueue = createAsyncQueue<NodeEntity>();
    const parentPathByUid = new Map<string, string[]>();
    const drive = getDrive();

    let pendingFetchTasks = 0;
    let archiveStorageSizeInBytes = 0;

    const enqueueForFetch = (node: NodeEntity, parentPath: string[]) => {
        parentPathByUid.set(node.uid, parentPath);
        pendingFetchTasks += 1;
        fetchQueue.push(node);
    };

    nodes.forEach((node) => enqueueForFetch(node, []));

    const totalEncryptedSizePromise = (async () => {
        try {
            for await (const node of fetchQueue.iterator()) {
                pendingFetchTasks -= 1;

                nodesQueue.push(node);

                if (node.type === NodeType.File) {
                    archiveStorageSizeInBytes += node.activeRevision?.storageSize ?? 0;
                } else {
                    const childrenParentPath = [...(parentPathByUid.get(node.uid) ?? []), node.name];
                    for await (const maybeNode of drive.iterateFolderChildren(node.uid, undefined, signal)) {
                        const { node: child } = getNodeEntity(maybeNode);
                        enqueueForFetch(child, childrenParentPath);
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

    return { nodesQueue, totalEncryptedSizePromise, parentPathByUid };
}
