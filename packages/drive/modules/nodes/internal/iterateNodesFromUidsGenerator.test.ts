import { AbortError, type MissingNode, ProtonDriveError } from '@protontech/drive-sdk';

import { iterateNodesFromUidsGenerator } from './iterateNodesFromUidsGenerator';

const mockDebug = jest.fn();
const mockInfo = jest.fn();

jest.mock('../../logging', () => ({
    logging: {
        getLogger: () => ({
            debug: (message: string) => mockDebug(message),
            info: (message: string) => mockInfo(message),
        }),
    },
}));

type TestNode = { uid: string; ok: boolean };

async function* toAsync(uids: string[]) {
    yield* uids;
}

async function* loadTestNodes(
    uids: string[],
    missingUids: string[] = [],
    degradedUids: string[] = []
): AsyncGenerator<TestNode | MissingNode> {
    for (const uid of uids) {
        if (missingUids.includes(uid)) {
            yield { missingUid: uid };
        } else {
            yield { uid, ok: !degradedUids.includes(uid) };
        }
    }
}

const makeDrive = (missingUids: string[] = [], degradedUids: string[] = []) => ({
    iterateNodes: jest.fn((uids: string[]) => loadTestNodes(uids, missingUids, degradedUids)),
});

const range = (count: number) => Array.from({ length: count }, (_, i) => `uid-${i}`);

describe('iterateNodesFromUidsGenerator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('yields nothing and does not load nodes for an empty listing', async () => {
        const drive = makeDrive();

        const nodes = await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync([]), drive));

        expect(nodes).toEqual([]);
        expect(drive.iterateNodes).not.toHaveBeenCalled();
    });

    it('loads a listing smaller than one batch in a single call', async () => {
        const drive = makeDrive();

        const nodes = await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(3)), drive));

        expect(nodes.map((node) => node.uid)).toEqual(range(3));
        expect(drive.iterateNodes).toHaveBeenCalledTimes(1);
    });

    it('loads a long listing in batches and keeps the order', async () => {
        const drive = makeDrive();
        const uids = range(1000);

        const nodes = await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(uids), drive));

        expect(nodes.map((node) => node.uid)).toEqual(uids);
        expect(drive.iterateNodes).toHaveBeenCalledTimes(34);
        expect(drive.iterateNodes.mock.calls[0][0]).toHaveLength(30);
        expect(drive.iterateNodes.mock.calls[33][0]).toHaveLength(10);
    });

    it('passes the abort signal to the node loading', async () => {
        const drive = makeDrive();
        const signal = new AbortController().signal;

        await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(1)), drive, { signal }));

        expect(drive.iterateNodes).toHaveBeenCalledWith(['uid-0'], signal);
    });

    it('skips missing nodes and logs them', async () => {
        const drive = makeDrive(['uid-1', 'uid-3']);

        const nodes = await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(5)), drive));

        expect(nodes.map((node) => node.uid)).toEqual(['uid-0', 'uid-2', 'uid-4']);
        expect(mockDebug).toHaveBeenCalledWith('Skipping missing node uid-1');
        expect(mockDebug).toHaveBeenCalledWith('Skipping missing node uid-3');
        expect(mockInfo).toHaveBeenCalledWith('Skipped 2 missing nodes from the listing');
    });

    it('does not log a summary when no node is missing', async () => {
        await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(2)), makeDrive()));

        expect(mockInfo).not.toHaveBeenCalled();
    });

    it('yields degraded nodes instead of skipping them', async () => {
        const drive = makeDrive([], ['uid-1']);

        const nodes = await Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(2)), drive));

        expect(nodes).toEqual([
            { uid: 'uid-0', ok: true },
            { uid: 'uid-1', ok: false },
        ]);
    });

    it('propagates errors from the listing', async () => {
        const error = new Error('listing failed');
        async function* failingListing() {
            yield 'uid-0';
            throw error;
        }

        await expect(Array.fromAsync(iterateNodesFromUidsGenerator(failingListing(), makeDrive()))).rejects.toBe(error);
    });

    it('keeps loading the remaining batches when one fails and throws at the end', async () => {
        const error = new Error('batch failed');
        const drive = makeDrive();
        drive.iterateNodes.mockImplementation(async function* (uids: string[]) {
            if (uids.includes('uid-30')) {
                yield { uid: uids[0], ok: true };
                throw error;
            }
            yield* loadTestNodes(uids);
        });
        const nodes: TestNode[] = [];
        let thrown: unknown;

        try {
            for await (const node of iterateNodesFromUidsGenerator(toAsync(range(100)), drive)) {
                nodes.push(node);
            }
        } catch (e) {
            thrown = e;
        }

        expect(thrown).toBeInstanceOf(ProtonDriveError);
        expect(thrown).toMatchObject({ message: 'Some items could not be loaded', cause: [error] });
        // Batch 1 (30), the first node of the failed batch 2, then batches 3 and 4 (30 + 10).
        expect(nodes).toHaveLength(71);
        expect(nodes.at(-1)?.uid).toBe('uid-99');
        expect(drive.iterateNodes).toHaveBeenCalledTimes(4);
    });

    it('logs the missing summary before throwing the batch errors', async () => {
        const drive = makeDrive();
        drive.iterateNodes.mockImplementation(async function* (uids: string[]) {
            if (uids.includes('uid-30')) {
                throw new Error('batch failed');
            }
            yield* loadTestNodes(uids, ['uid-0']);
        });

        await expect(Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(31)), drive))).rejects.toBeInstanceOf(
            ProtonDriveError
        );
        expect(mockInfo).toHaveBeenCalledWith('Skipped 1 missing nodes from the listing');
    });

    it('stops right away on abort', async () => {
        const abortError = new AbortError();
        const drive = makeDrive();
        drive.iterateNodes.mockImplementation(async function* (): AsyncGenerator<TestNode | MissingNode> {
            throw abortError;
        });

        await expect(Array.fromAsync(iterateNodesFromUidsGenerator(toAsync(range(100)), drive))).rejects.toBe(
            abortError
        );
        expect(drive.iterateNodes).toHaveBeenCalledTimes(1);
    });
});
