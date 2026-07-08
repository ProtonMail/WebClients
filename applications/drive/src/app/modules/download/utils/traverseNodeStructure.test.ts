import { NodeType } from '@proton/drive/index';
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import { DownloadDriveClientRegistry } from '../DownloadDriveClientRegistry';
import { MAX_CONCURRENT_FOLDER_TRAVERSALS, traverseAlbum, traverseNodeStructure } from './traverseNodeStructure';

jest.mock('../DownloadDriveClientRegistry', () => ({
    DownloadDriveClientRegistry: {
        getDriveClient: jest.fn(),
        getDrivePhotosClient: jest.fn(),
    },
}));

jest.mock('../../../utils/sdk/getNodeStorageSize', () => ({
    getNodeStorageSize: (node: { uid: string }) => {
        const sizes: Record<string, number> = {
            file1: 1000,
            file2: 2000,
            file3: 3000,
            fileInA: 500,
            fileInB: 600,
            fileInC: 700,
        };
        return sizes[node.uid] ?? 0;
    },
}));

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const CHILDREN_DELAY_MS = 181;
const NODES_DELAY_MS = 131;

type MockDriveClient = {
    iterateFolderChildrenNodeUids: jest.Mock;
    iterateNodes: jest.Mock;
};

type MockPhotosClient = {
    iterateNodes: jest.Mock;
    iterateAlbum: jest.Mock;
};

const makeNode = (uid: string, type: NodeType, mediaType = 'text/plain') =>
    ({ uid, type, name: { ok: true as const, value: uid }, mediaType, errors: [] }) as any;

const makeFile = (uid: string) => makeNode(uid, NodeType.File);
const makeFolder = (uid: string) => makeNode(uid, NodeType.Folder);
const makePhoto = (uid: string, relatedPhotoNodeUids: string[] = []) =>
    ({
        uid,
        type: NodeType.Photo,
        name: { ok: true as const, value: uid },
        mediaType: 'image/jpeg',
        errors: [],
        photo: { relatedPhotoNodeUids },
    }) as any;

describe('traverseNodeStructure', () => {
    let mockClient: MockDriveClient;

    beforeEach(() => {
        mockClient = {
            iterateFolderChildrenNodeUids: jest.fn(),
            iterateNodes: jest.fn(),
        };
        (DownloadDriveClientRegistry.getDriveClient as jest.Mock).mockReturnValue(mockClient);
    });

    it('skips unsupported nodes and reports containsUnsupportedFile', async () => {
        const supportedNode = makeFile('supported');
        const unsupportedNode = makeNode('unsupported', NodeType.File, PROTON_DOCS_DOCUMENT_MIMETYPE);

        const { nodesQueue, traversalCompletedPromise, parentPathByUid } = traverseNodeStructure(
            [supportedNode, unsupportedNode],
            new AbortController().signal
        );

        const consumedUids: string[] = [];
        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                consumedUids.push(node.uid);
            }
        })();

        const result = await traversalCompletedPromise;
        await consumeQueue;

        expect(consumedUids).toEqual(['supported']);
        expect(result.containsUnsupportedFile).toBe(true);
        expect(parentPathByUid.get('supported')).toEqual([]);
        expect(parentPathByUid.get('unsupported')).toEqual([]);
    });

    it('traverses sibling folders concurrently', async () => {
        const root = makeFolder('root');
        const folderA = makeFolder('folderA');
        const folderB = makeFolder('folderB');
        const folderC = makeFolder('folderC');
        const fileInA = makeFile('fileInA');
        const fileInB = makeFile('fileInB');
        const fileInC = makeFile('fileInC');

        const nodeMap: Record<string, any> = { folderA, folderB, folderC, fileInA, fileInB, fileInC };

        let currentConcurrent = 0;
        let peakConcurrent = 0;

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* (uid: string) {
            currentConcurrent++;
            peakConcurrent = Math.max(peakConcurrent, currentConcurrent);
            try {
                await delay(CHILDREN_DELAY_MS);
                if (uid === 'root') {
                    yield 'folderA';
                    yield 'folderB';
                    yield 'folderC';
                } else if (uid === 'folderA') {
                    yield 'fileInA';
                } else if (uid === 'folderB') {
                    yield 'fileInB';
                } else if (uid === 'folderC') {
                    yield 'fileInC';
                }
            } finally {
                currentConcurrent--;
            }
        });

        mockClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            await delay(NODES_DELAY_MS);
            for (const uid of uids) {
                yield nodeMap[uid];
            }
        });

        const { nodesQueue, traversalCompletedPromise } = traverseNodeStructure([root], new AbortController().signal);

        const consumedUids: string[] = [];
        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                consumedUids.push(node.uid);
            }
        })();

        await traversalCompletedPromise;
        await consumeQueue;

        expect(consumedUids).toContain('root');
        expect(consumedUids).toContain('folderA');
        expect(consumedUids).toContain('folderB');
        expect(consumedUids).toContain('folderC');
        expect(consumedUids).toContain('fileInA');
        expect(consumedUids).toContain('fileInB');
        expect(consumedUids).toContain('fileInC');

        // folderA, folderB and folderC sit at the same level, so their child fetches overlap
        // instead of running one after another.
        expect(peakConcurrent).toBeGreaterThan(1);
    });

    it(`limits concurrent folder traversals to ${MAX_CONCURRENT_FOLDER_TRAVERSALS}`, async () => {
        const folderCount = MAX_CONCURRENT_FOLDER_TRAVERSALS + 3;
        const folders = Array.from({ length: folderCount }, (_, i) => makeFolder(`folder${i}`));

        let currentConcurrent = 0;
        let peakConcurrent = 0;

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* () {
            currentConcurrent++;
            peakConcurrent = Math.max(peakConcurrent, currentConcurrent);
            await delay(50);
            currentConcurrent--;
        });

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        mockClient.iterateNodes.mockImplementation(async function* () {});

        const { traversalCompletedPromise } = traverseNodeStructure(folders, new AbortController().signal);
        await traversalCompletedPromise;

        expect(peakConcurrent).toBeLessThanOrEqual(MAX_CONCURRENT_FOLDER_TRAVERSALS);
        expect(peakConcurrent).toBeGreaterThan(1);
    });

    it('batches iterateNodes for sibling folders finishing at the same time', async () => {
        const root = makeFolder('root');
        const folderA = makeFolder('folderA');
        const folderB = makeFolder('folderB');
        const fileInA = makeFile('fileInA');
        const fileInB = makeFile('fileInB');

        const nodeMap: Record<string, any> = { folderA, folderB, fileInA, fileInB };

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* (uid: string) {
            await delay(CHILDREN_DELAY_MS); // both folders finish at the same time
            if (uid === 'root') {
                yield 'folderA';
                yield 'folderB';
            } else if (uid === 'folderA') {
                yield 'fileInA';
            } else if (uid === 'folderB') {
                yield 'fileInB';
            }
        });

        mockClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            await delay(NODES_DELAY_MS);
            for (const uid of uids) {
                yield nodeMap[uid];
            }
        });

        const { traversalCompletedPromise } = traverseNodeStructure([root], new AbortController().signal);
        await traversalCompletedPromise;

        const calls = mockClient.iterateNodes.mock.calls as string[][][];
        // root's children (folderA, folderB) → 1 iterateNodes call
        // folderA and folderB finish at the same time → their children batched into 1 call
        // Total: 2 calls instead of 3
        expect(calls.length).toBe(2);
        expect(calls[0][0]).toEqual(['folderA', 'folderB']);
        const batchedChildUids = calls[1][0].sort();
        expect(batchedChildUids).toEqual(['fileInA', 'fileInB'].sort());
    });

    it('never runs more than one iterateNodes call at a time', async () => {
        const root = makeFolder('root');
        const depth = 6;
        const chainUids = Array.from({ length: depth }, (_, i) => `folder${i}`);
        const nodeMap: Record<string, any> = Object.fromEntries(chainUids.map((uid) => [uid, makeFolder(uid)]));

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* (uid: string) {
            await delay(10);
            if (uid === 'root') {
                yield chainUids[0];
            } else {
                const next = chainUids[chainUids.indexOf(uid) + 1];
                if (next) {
                    yield next;
                }
            }
        });

        let currentConcurrent = 0;
        let peakConcurrent = 0;
        mockClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            currentConcurrent++;
            peakConcurrent = Math.max(peakConcurrent, currentConcurrent);
            try {
                await delay(NODES_DELAY_MS);
                for (const uid of uids) {
                    yield nodeMap[uid];
                }
            } finally {
                currentConcurrent--;
            }
        });

        const { traversalCompletedPromise } = traverseNodeStructure([root], new AbortController().signal);
        await traversalCompletedPromise;

        expect(peakConcurrent).toBe(1);
    });

    it('sets correct parentPathByUid for nested folders', async () => {
        const root = makeFolder('root');
        const child = makeFolder('child');
        const grandchild = makeFile('grandchild');

        const nodeMap: Record<string, any> = { child, grandchild };

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* (uid: string) {
            if (uid === 'root') {
                yield 'child';
            } else if (uid === 'child') {
                yield 'grandchild';
            }
        });

        mockClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            for (const uid of uids) {
                yield nodeMap[uid];
            }
        });

        const { traversalCompletedPromise, parentPathByUid } = traverseNodeStructure(
            [root],
            new AbortController().signal
        );
        await traversalCompletedPromise;

        expect(parentPathByUid.get('root')).toEqual([]);
        expect(parentPathByUid.get('child')).toEqual(['root']);
        expect(parentPathByUid.get('grandchild')).toEqual(['root', 'child']);
    });

    it('sums totalEncryptedSize across all files', async () => {
        const file1 = makeFile('file1');
        const file2 = makeFile('file2');
        const file3 = makeFile('file3');

        const { traversalCompletedPromise } = traverseNodeStructure(
            [file1, file2, file3],
            new AbortController().signal
        );
        const result = await traversalCompletedPromise;

        expect(result.totalEncryptedSize).toBe(6000);
    });

    it('rejects and errors the queue when collecting a folder fails', async () => {
        const root = makeFolder('root');

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* () {
            throw new Error('fetch failed');
        });
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        mockClient.iterateNodes.mockImplementation(async function* () {});

        const { nodesQueue, traversalCompletedPromise } = traverseNodeStructure([root], new AbortController().signal);

        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                void node;
            }
        })();

        await expect(traversalCompletedPromise).rejects.toThrow('fetch failed');
        await expect(consumeQueue).rejects.toThrow('fetch failed');
    });

    it('rejects when the batched node fetch fails', async () => {
        const root = makeFolder('root');

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* (uid: string) {
            if (uid === 'root') {
                yield 'child';
            }
        });
        mockClient.iterateNodes.mockImplementation(async function* () {
            throw new Error('batch failed');
        });

        const { traversalCompletedPromise } = traverseNodeStructure([root], new AbortController().signal);

        await expect(traversalCompletedPromise).rejects.toThrow('batch failed');
    });

    it('skips a missing descendant deep inside a folder and archives the rest', async () => {
        const root = makeFolder('root');
        const child = makeFolder('child');

        mockClient.iterateFolderChildrenNodeUids.mockImplementation(async function* (uid: string) {
            if (uid === 'root') {
                yield 'child';
            } else if (uid === 'child') {
                yield 'missing-grandchild';
            }
        });
        mockClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            for (const uid of uids) {
                if (uid === 'child') {
                    yield child;
                }
                // 'missing-grandchild' is silently dropped by the SDK, simulating a missing node.
            }
        });

        const { nodesQueue, traversalCompletedPromise } = traverseNodeStructure([root], new AbortController().signal);

        const consumedUids: string[] = [];
        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                consumedUids.push(node.uid);
            }
        })();

        await traversalCompletedPromise;
        await consumeQueue;

        expect(consumedUids).toEqual(['root', 'child']);
    });
});

describe('traverseAlbum', () => {
    let mockPhotosClient: MockPhotosClient;

    beforeEach(() => {
        mockPhotosClient = {
            iterateNodes: jest.fn(),
            iterateAlbum: jest.fn(),
        };
        (DownloadDriveClientRegistry.getDrivePhotosClient as jest.Mock).mockReturnValue(mockPhotosClient);
    });

    it('traverses every album item and never pushes the album node itself', async () => {
        const photo1 = makePhoto('photo1');
        const photo2 = makePhoto('photo2');
        const nodeMap: Record<string, any> = { photo1, photo2 };

        mockPhotosClient.iterateAlbum.mockImplementation(async function* () {
            yield { nodeUid: 'photo1', captureTime: new Date() };
            yield { nodeUid: 'photo2', captureTime: new Date() };
        });
        mockPhotosClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            for (const uid of uids) {
                yield nodeMap[uid];
            }
        });

        const { nodesQueue, traversalCompletedPromise, parentPathByUid } = traverseAlbum(
            'album-1',
            new AbortController().signal
        );

        const consumedUids: string[] = [];
        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                consumedUids.push(node.uid);
            }
        })();

        await traversalCompletedPromise;
        await consumeQueue;

        expect(consumedUids.sort()).toEqual(['photo1', 'photo2']);
        expect(consumedUids).not.toContain('album-1');
        expect(parentPathByUid.get('photo1')).toEqual([]);
    });

    it('skips a missing album item and archives the rest', async () => {
        const photo1 = makePhoto('photo1');
        const nodeMap: Record<string, any> = { photo1 };

        mockPhotosClient.iterateAlbum.mockImplementation(async function* () {
            yield { nodeUid: 'photo1', captureTime: new Date() };
            yield { nodeUid: 'missing-photo', captureTime: new Date() };
        });
        mockPhotosClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            for (const uid of uids) {
                if (nodeMap[uid]) {
                    yield nodeMap[uid];
                }
            }
        });

        const { nodesQueue, traversalCompletedPromise } = traverseAlbum('album-1', new AbortController().signal);

        const consumedUids: string[] = [];
        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                consumedUids.push(node.uid);
            }
        })();

        await traversalCompletedPromise;
        await consumeQueue;

        expect(consumedUids).toEqual(['photo1']);
    });

    it('pushes each album item to the queue as it is resolved, without waiting for the full album listing', async () => {
        const photo1 = makePhoto('photo1');
        const photo2 = makePhoto('photo2');
        const nodeMap: Record<string, any> = { photo1, photo2 };

        mockPhotosClient.iterateAlbum.mockImplementation(async function* () {
            yield { nodeUid: 'photo1', captureTime: new Date() };
            await delay(CHILDREN_DELAY_MS);
            yield { nodeUid: 'photo2', captureTime: new Date() };
        });
        mockPhotosClient.iterateNodes.mockImplementation(async function* (uids: string[]) {
            for (const uid of uids) {
                yield nodeMap[uid];
            }
        });

        const { nodesQueue, traversalCompletedPromise } = traverseAlbum('album-1', new AbortController().signal);

        const iterator = nodesQueue.iterator();
        const firstNode = await iterator.next();

        expect(firstNode.value?.uid).toBe('photo1');

        const consumedUids = [firstNode.value?.uid as string];
        const consumeRest = (async () => {
            for await (const node of iterator) {
                consumedUids.push(node.uid);
            }
        })();

        await traversalCompletedPromise;
        await consumeRest;

        expect(consumedUids.sort()).toEqual(['photo1', 'photo2']);
    });
});
