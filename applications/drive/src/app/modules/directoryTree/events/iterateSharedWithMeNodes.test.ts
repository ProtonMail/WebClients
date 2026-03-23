import { NodeType, getDrive } from '@proton/drive/index';
import { sendErrorReport } from '@proton/drive/internal/BusDriver/errorHandling';

import { iterateSharedWithMeNodes } from './iterateSharedWithMeNodes';

jest.mock('@proton/drive/index', () => ({
    ...jest.requireActual('@proton/drive/index'),
    getDrive: jest.fn(),
}));
jest.mock('@proton/drive/internal/BusDriver/errorHandling');

const mockedGetDrive = jest.mocked(getDrive);
const mockedSendErrorReport = jest.mocked(sendErrorReport);

const makeNode = (overrides = {}) => ({
    ok: true as const,
    value: {
        uid: 'node-1',
        name: 'Folder',
        type: NodeType.Folder,
        isShared: false,
        ...overrides,
    },
});

async function* makeIterator(nodes: ReturnType<typeof makeNode>[]) {
    for (const node of nodes) {
        yield node;
    }
}

beforeEach(() => {
    jest.clearAllMocks();
    mockedGetDrive.mockReturnValue({
        iterateSharedNodesWithMe: jest.fn().mockReturnValue(makeIterator([])),
    } as any);
});

describe('iterateSharedWithMeNodes', () => {
    it('returns valid nodes with signatureIssues', async () => {
        mockedGetDrive.mockReturnValue({
            iterateSharedNodesWithMe: jest.fn().mockReturnValue(makeIterator([makeNode()])),
        } as any);

        const result = await iterateSharedWithMeNodes();

        expect(result).toHaveLength(1);
        expect(result[0].node.uid).toBe('node-1');
    });

    it('reports iterator errors and returns partial results without throwing', async () => {
        mockedGetDrive.mockReturnValue({
            iterateSharedNodesWithMe: jest.fn().mockReturnValue(
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
