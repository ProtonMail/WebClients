import type { NodeEntity } from '@proton/drive';
import { NodeType, getDrive } from '@proton/drive/index';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import type { AsyncQueue } from './asyncQueue';
import { createAsyncQueue } from './asyncQueue';
import { getNodeStorageSize } from './getNodeStorageSize';
import { checkUnsupportedNode } from './hydrateAndCheckNodes';

export type ArchiveTraversalResult = {
    nodesQueue: AsyncQueue<NodeEntity>;
    traversalCompletedPromise: Promise<{ totalEncryptedSize: number; containsUnsupportedFile: boolean }>;
    parentPathByUid: Map<string, string[]>;
};

/**
 * Traverse the provided nodes, enqueueing them for archive generation and calculating total size.
 */
export function traverseNodeStructure(nodes: NodeEntity[], signal: AbortSignal): ArchiveTraversalResult {
    const fetchQueue = createAsyncQueue<NodeEntity>();
    const nodesQueue = createAsyncQueue<NodeEntity>();
    const parentPathByUid = new Map<string, string[]>();
    const drive = getDrive();

    let pendingFetchTasks = 0;
    let totalEncryptedSize = 0;
    let containsUnsupportedFile = false;

    const enqueueForFetch = (node: NodeEntity, parentPath: string[]) => {
        parentPathByUid.set(node.uid, parentPath);
        pendingFetchTasks += 1;
        fetchQueue.push(node);
    };

    nodes.forEach((node) => enqueueForFetch(node, []));

    const closeQueueIfDone = () => {
        if (pendingFetchTasks === 0) {
            fetchQueue.close();
        }
    };

    const traversalCompletedPromise = (async () => {
        try {
            for await (const node of fetchQueue.iterator()) {
                pendingFetchTasks -= 1;

                if (checkUnsupportedNode(node)) {
                    containsUnsupportedFile = true;
                    closeQueueIfDone();
                    continue;
                }

                nodesQueue.push(node);

                if (node.type === NodeType.File) {
                    totalEncryptedSize += getNodeStorageSize(node);
                } else {
                    const childrenParentPath = [...(parentPathByUid.get(node.uid) ?? []), node.name];
                    for await (const maybeNode of drive.iterateFolderChildren(node.uid, undefined, signal)) {
                        const { node: child } = getNodeEntity(maybeNode);
                        enqueueForFetch(child, childrenParentPath);
                    }
                }

                closeQueueIfDone();
            }

            nodesQueue.close();
            fetchQueue.close();
            return { totalEncryptedSize, containsUnsupportedFile };
        } catch (error) {
            fetchQueue.close();
            nodesQueue.error(error);
            throw error;
        }
    })();

    return { nodesQueue, traversalCompletedPromise, parentPathByUid };
}
