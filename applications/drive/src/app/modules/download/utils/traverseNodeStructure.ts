import type { NodeEntity, PhotoNode } from '@proton/drive';
import { NodeType } from '@proton/drive';
import { getNodeName, isMissingNode } from '@proton/drive/modules/nodes';

import type { AsyncQueue } from '../../../utils/asyncQueue';
import { createAsyncQueue } from '../../../utils/asyncQueue';
import { createConcurrencyLimiter } from '../../../utils/createConcurrencyLimiter';
import { getNodeStorageSize } from '../../../utils/sdk/getNodeStorageSize';
import { DownloadDriveClientRegistry } from '../DownloadDriveClientRegistry';
import { downloadLogDebug } from './downloadLogger';
import { checkUnsupportedNode } from './hydrateAndCheckNodes';

export const MAX_CONCURRENT_FOLDER_TRAVERSALS = 2;

// Sibling folders that finish collecting their child uids within this window share a single
// iterateNodes call, so we resolve multiple nodes in one round-trip instead of one each.
const BATCH_WINDOW_MS = 50;

export type ArchiveTraversalResult = {
    nodesQueue: AsyncQueue<NodeEntity>;
    traversalCompletedPromise: Promise<{ totalEncryptedSize: number; containsUnsupportedFile: boolean }>;
    parentPathByUid: Map<string, string[]>;
};

type DriveClient = ReturnType<typeof DownloadDriveClientRegistry.getDriveClient>;

/**
 * Batches iterateNodes lookups: callers that request uids within BATCH_WINDOW_MS share a single
 * round-trip, and each caller is resolved with the nodes for the uids it asked for.
 *
 * Several callers each ask for their own uids within the time window:
 *
 *   loadNodes(['a','b'])  ─┐
 *   loadNodes(['c'])      ─┼─►  pending: [{uids:['a','b']}, {uids:['c']}, {uids:['d','e']}]
 *   loadNodes(['d','e'])  ─┘
 *
 * On flush we merge every request's uids into one list (flatMap) and fetch them in a single call:
 *
 *   allUids = ['a','b','c','d','e']  ──►  iterateNodes  ──►  nodeByUid { a, b, d, e }
 *                                                                          ^ 'c' missing, skipped
 *
 * Then we demultiplex: each caller gets back only the nodes for the uids it asked for, dropping
 * any uid with no match (missing nodes are skipped above):
 *
 *   {uids:['a','b']}  ──►  resolve([a, b])
 *   {uids:['c']}      ──►  resolve([])        // 'c' was missing
 *   {uids:['d','e']}  ──►  resolve([d, e])
 */
function createBatchedNodeLoader(driveClient: Pick<DriveClient, 'iterateNodes'>, signal: AbortSignal) {
    type PendingRequest = {
        uids: string[];
        resolve: (nodes: NodeEntity[]) => void;
        reject: (error: unknown) => void;
    };

    let pending: PendingRequest[] = [];
    let flushTimer: ReturnType<typeof setTimeout> | null = null;
    let activeFlush: Promise<void> | null = null;

    const flush = async () => {
        const batch = pending;
        pending = [];

        const allUids = batch.flatMap((request) => request.uids);
        const batchStart = performance.now();
        downloadLogDebug('iterateNodes batch flush', { totalUids: allUids.length, requestsGrouped: batch.length });

        const nodeByUid = new Map<string, NodeEntity>();
        try {
            for await (const node of driveClient.iterateNodes(allUids, signal)) {
                if (!isMissingNode(node)) {
                    nodeByUid.set(node.uid, node);
                }
            }
            downloadLogDebug('iterateNodes batch done', { ms: Math.round(performance.now() - batchStart) });
            batch.forEach((request) => {
                const nodes = request.uids
                    .map((uid) => nodeByUid.get(uid))
                    .filter((node): node is NodeEntity => node !== undefined);
                request.resolve(nodes);
            });
        } catch (error) {
            batch.forEach((request) => request.reject(error));
        }
    };

    function runFlush() {
        flushTimer = null;
        activeFlush = flush().finally(() => {
            activeFlush = null;
            if (pending.length > 0) {
                scheduleFlush();
            }
        });
    }

    function scheduleFlush() {
        if (flushTimer || activeFlush) {
            return;
        }
        flushTimer = setTimeout(runFlush, BATCH_WINDOW_MS);
    }

    return (uids: string[]): Promise<NodeEntity[]> => {
        if (uids.length === 0) {
            return Promise.resolve([]);
        }
        return new Promise<NodeEntity[]>((resolve, reject) => {
            pending.push({ uids, resolve, reject });
            scheduleFlush();
        });
    };
}

/**
 * Traverse the provided nodes, enqueueing them for archive generation and calculating total size.
 */
export function traverseNodeStructure(nodes: NodeEntity[], signal: AbortSignal): ArchiveTraversalResult {
    const nodesQueue = createAsyncQueue<NodeEntity>();
    const parentPathByUid = new Map<string, string[]>();
    const driveClient = DownloadDriveClientRegistry.getDriveClient();
    const traversalStart = performance.now();

    let totalEncryptedSize = 0;
    let containsUnsupportedFile = false;

    const limitFolderRequests = createConcurrencyLimiter(MAX_CONCURRENT_FOLDER_TRAVERSALS);
    const loadNodes = createBatchedNodeLoader(driveClient, signal);

    const walk = async (node: NodeEntity, parentPath: string[]): Promise<void> => {
        parentPathByUid.set(node.uid, parentPath);

        if (checkUnsupportedNode(node)) {
            containsUnsupportedFile = true;
            return;
        }

        nodesQueue.push(node);

        if (node.type !== NodeType.Folder) {
            totalEncryptedSize += getNodeStorageSize(node);
            return;
        }

        const childUids = await limitFolderRequests.run(async () => {
            const folderStart = performance.now();
            const uids: string[] = [];
            for await (const uid of driveClient.iterateFolderChildrenNodeUids(node.uid, undefined, signal)) {
                uids.push(uid);
            }
            downloadLogDebug('iterateFolderChildrenNodeUids done', {
                folderUid: node.uid,
                childCount: uids.length,
                ms: Math.round(performance.now() - folderStart),
            });
            return uids;
        });

        const children = await loadNodes(childUids);
        const childPath = [...parentPath, getNodeName(node)];
        await Promise.all(children.map((child) => walk(child, childPath)));
    };

    // Walking every node in parallel is fine even for large selections. The requests stay capped:
    // listing a folder's children goes through limitFolderRequests, and loading the children nodes
    // goes through the batched loader, which runs iterateNodes one call at a time. File nodes make
    // no request on their own, they are just pushed to nodesQueue for the archive generator.
    const traversalCompletedPromise = Promise.all(nodes.map((node) => walk(node, [])))
        .then(() => {
            nodesQueue.close();
            downloadLogDebug('Traversal complete', {
                totalMs: Math.round(performance.now() - traversalStart),
                totalEncryptedSize,
            });
            return { totalEncryptedSize, containsUnsupportedFile };
        })
        .catch((error) => {
            nodesQueue.error(error);
            throw error;
        });

    return { nodesQueue, traversalCompletedPromise, parentPathByUid };
}

/**
 * Traverse a whole album, sourcing its top-level items from `iterateAlbum` instead of folder
 * children. The album itself is never pushed to the queue (the resulting archive is flat), and
 * albums have no folders to recurse into, so this doesn't share the folder-walking code above.
 * Like folder children, a missing item is skipped rather than failing the whole album.
 */
export function traverseAlbum(albumNodeUid: string, signal: AbortSignal): ArchiveTraversalResult {
    const nodesQueue = createAsyncQueue<NodeEntity>();
    const parentPathByUid = new Map<string, string[]>();
    const drivePhotosClient = DownloadDriveClientRegistry.getDrivePhotosClient();
    const traversalStart = performance.now();

    let totalEncryptedSize = 0;
    let containsUnsupportedFile = false;

    const loadNodes = createBatchedNodeLoader(drivePhotosClient, signal);

    const walk = async (node: NodeEntity, parentPath: string[]): Promise<void> => {
        parentPathByUid.set(node.uid, parentPath);

        if (checkUnsupportedNode(node)) {
            containsUnsupportedFile = true;
            return;
        }

        nodesQueue.push(node);
        totalEncryptedSize += getNodeStorageSize(node);

        // Live photos pair a photo with a related video node that also needs to be archived.
        const relatedUids = (node as PhotoNode).photo?.relatedPhotoNodeUids;
        if (relatedUids?.length) {
            const relatedNodes = await loadNodes(relatedUids);
            await Promise.all(relatedNodes.map((related) => walk(related, parentPath)));
        }
    };

    const traversalCompletedPromise = (async () => {
        // Each item is loaded (and walked, i.e. pushed to nodesQueue) as soon as it's yielded,
        // instead of collecting the whole album's uids before doing a single bulk load: the archive
        // generator can start consuming nodesQueue while iterateAlbum is still paginating.
        const itemWalks: Promise<void>[] = [];
        for await (const item of drivePhotosClient.iterateAlbum(albumNodeUid, signal)) {
            itemWalks.push(
                loadNodes([item.nodeUid]).then(([node]) => {
                    // Item missing (removed elsewhere): skip it and keep archiving the rest.
                    if (!node) {
                        return;
                    }
                    return walk(node, []);
                })
            );
        }

        await Promise.all(itemWalks);

        nodesQueue.close();
        downloadLogDebug('Traversal complete', {
            totalMs: Math.round(performance.now() - traversalStart),
            totalEncryptedSize,
        });
        return { totalEncryptedSize, containsUnsupportedFile };
    })().catch((error) => {
        nodesQueue.error(error);
        throw error;
    });

    return { nodesQueue, traversalCompletedPromise, parentPathByUid };
}
