import { sendErrorReport } from '../../../../modules/busDriver';
import { NodeType, getDrive } from '../../../../sdk';
import { iterateSharedWithMeNodes } from './iterateSharedWithMeNodes';

jest.mock('../../../../sdk', () => ({
    ...jest.requireActual('../../../../sdk'),
    getDrive: jest.fn(),
}));
jest.mock('../../../../modules/busDriver');

const mockedGetDrive = jest.mocked(getDrive);
const mockedSendErrorReport = jest.mocked(sendErrorReport);

const makeNode = (overrides = {}) => ({
    uid: 'node-1',
    name: 'Folder',
    type: NodeType.Folder,
    isShared: false,
    ...overrides,
});

async function* makeIterator<T>(items: T[]) {
    for (const item of items) {
        yield item;
    }
}

const makeDrive = (nodes: ReturnType<typeof makeNode>[], missingUids: string[] = []) => ({
    iterateSharedWithMeNodeUids: jest
        .fn()
        .mockReturnValue(makeIterator([...nodes.map((node) => node.uid), ...missingUids])),
    iterateNodes: jest
        .fn()
        .mockImplementation((uids: string[]) =>
            makeIterator(uids.map((uid) => nodes.find((node) => node.uid === uid) ?? { missingUid: uid }))
        ),
});

beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDrive.mockReturnValue(makeDrive([]) as any);
});

describe('iterateSharedWithMeNodes', () => {
    it('returns valid nodes with signatureIssues', async () => {
        mockedGetDrive.mockReturnValue(makeDrive([makeNode()]) as any);

        const result = await iterateSharedWithMeNodes();

        expect(result).toHaveLength(1);
        expect(result[0].node.uid).toBe('node-1');
    });

    it('skips nodes that are missing when loaded', async () => {
        mockedGetDrive.mockReturnValue(makeDrive([makeNode()], ['deleted-node']) as any);

        const result = await iterateSharedWithMeNodes();

        expect(result.map(({ node }) => node.uid)).toEqual(['node-1']);
        expect(mockedSendErrorReport).not.toHaveBeenCalled();
    });

    it('reports iterator errors and returns partial results without throwing', async () => {
        mockedGetDrive.mockReturnValue({
            iterateSharedWithMeNodeUids: jest.fn().mockReturnValue(
                (async function* () {
                    throw new Error('network failure');
                })()
            ),
        } as any);

        const result = await iterateSharedWithMeNodes();

        expect(result).toHaveLength(0);
        expect(mockedSendErrorReport).toHaveBeenCalledWith(expect.any(Error));
    });
});
