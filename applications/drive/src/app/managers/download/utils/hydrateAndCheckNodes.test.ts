import type { NodeEntity } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { hydrateAndCheckNodes } from './hydrateAndCheckNodes';

jest.mock('@proton/drive/index', () => ({
    getDrive: jest.fn(),
}));

jest.mock('../../../utils/sdk/getNodeEntity', () => ({
    getNodeEntity: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/mimetype', () => ({
    isProtonDocsDocument: jest.fn(),
    isProtonDocsSpreadsheet: jest.fn(),
}));

const createAsyncIterable = <T>(items: T[]) =>
    (async function* iterate() {
        for (const item of items) {
            yield item;
        }
    })();

const mockGetDrive = getDrive as jest.MockedFunction<typeof getDrive>;
const mockGetNodeEntity = getNodeEntity as jest.MockedFunction<typeof getNodeEntity>;
const mockIsProtonDocsDocument = isProtonDocsDocument as jest.MockedFunction<typeof isProtonDocsDocument>;
const mockIsProtonDocsSpreadsheet = isProtonDocsSpreadsheet as jest.MockedFunction<typeof isProtonDocsSpreadsheet>;

describe('hydrateAndCheckNodes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('hydrates nodes from the sdk and reports no unsupported files', async () => {
        const iterateNodes = jest.fn();
        const drive = { iterateNodes };
        mockGetDrive.mockReturnValue(drive as unknown as ReturnType<typeof getDrive>);

        const maybeNodeA = { ok: true, value: Symbol('maybe-node-a') } as unknown;
        const maybeNodeB = { ok: true, value: Symbol('maybe-node-b') } as unknown;
        iterateNodes.mockReturnValue(createAsyncIterable([maybeNodeA, maybeNodeB]));

        const nodeA = { uid: 'uid-a', mediaType: 'image/png' } as unknown as NodeEntity;
        const nodeB = { uid: 'uid-b', mediaType: 'image/jpeg' } as unknown as NodeEntity;
        mockGetNodeEntity.mockReturnValueOnce({ node: nodeA, errors: new Map() }).mockReturnValueOnce({
            node: nodeB,
            errors: new Map(),
        });

        mockIsProtonDocsDocument.mockReturnValue(false);
        mockIsProtonDocsSpreadsheet.mockReturnValue(false);

        const result = await hydrateAndCheckNodes(['uid-a', 'uid-b']);

        expect(iterateNodes).toHaveBeenCalledWith(['uid-a', 'uid-b']);
        expect(mockGetNodeEntity).toHaveBeenNthCalledWith(1, maybeNodeA);
        expect(mockGetNodeEntity).toHaveBeenNthCalledWith(2, maybeNodeB);
        expect(result).toEqual({ nodes: [nodeA, nodeB], containsUnsupportedFile: undefined });
    });

    it('flags when any hydrated node is unsupported', async () => {
        const iterateNodes = jest.fn();
        const drive = { iterateNodes };
        mockGetDrive.mockReturnValue(drive as unknown as ReturnType<typeof getDrive>);

        const maybeNode = { ok: true, value: Symbol('maybe-node') } as unknown;
        iterateNodes.mockReturnValue(createAsyncIterable([maybeNode, maybeNode]));

        const supportedNode = { uid: 'uid-1', mediaType: 'image/png' } as unknown as NodeEntity;
        const unsupportedNode = { uid: 'uid-2', mediaType: 'application/proton-docs' } as unknown as NodeEntity;
        mockGetNodeEntity
            .mockReturnValueOnce({ node: supportedNode, errors: new Map() })
            .mockReturnValueOnce({ node: unsupportedNode, errors: new Map() });

        mockIsProtonDocsDocument.mockImplementation((mediaType: string) => mediaType === 'application/proton-docs');
        mockIsProtonDocsSpreadsheet.mockReturnValue(false);

        const result = await hydrateAndCheckNodes(['uid-1', 'uid-2']);

        expect(iterateNodes).toHaveBeenCalledWith(['uid-1', 'uid-2']);
        expect(mockIsProtonDocsDocument).toHaveBeenNthCalledWith(1, supportedNode.mediaType);
        expect(mockIsProtonDocsDocument).toHaveBeenNthCalledWith(2, unsupportedNode.mediaType);
        expect(result).toEqual({ nodes: [supportedNode, unsupportedNode], containsUnsupportedFile: true });
    });
});
