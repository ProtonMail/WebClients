import type { NodeEntity } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { hydrateAndCheckNodes } from './hydrateAndCheckNodes';

jest.mock('@proton/drive/index', () => ({
    getDrive: jest.fn(),
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

        const nodeA = { uid: 'uid-a', mediaType: 'image/png' } as unknown as NodeEntity;
        const nodeB = { uid: 'uid-b', mediaType: 'image/jpeg' } as unknown as NodeEntity;
        iterateNodes.mockReturnValue(createAsyncIterable([nodeA, nodeB]));

        mockIsProtonDocsDocument.mockReturnValue(false);
        mockIsProtonDocsSpreadsheet.mockReturnValue(false);

        const result = await hydrateAndCheckNodes(['uid-a', 'uid-b']);

        expect(iterateNodes).toHaveBeenCalledWith(['uid-a', 'uid-b']);
        expect(result).toEqual({ nodes: [nodeA, nodeB], containsUnsupportedFile: undefined });
    });

    it('flags when any hydrated node is unsupported', async () => {
        const iterateNodes = jest.fn();
        const drive = { iterateNodes };
        mockGetDrive.mockReturnValue(drive as unknown as ReturnType<typeof getDrive>);

        const supportedNode = { uid: 'uid-1', mediaType: 'image/png' } as unknown as NodeEntity;
        const unsupportedNode = { uid: 'uid-2', mediaType: 'application/proton-docs' } as unknown as NodeEntity;
        iterateNodes.mockReturnValue(createAsyncIterable([supportedNode, unsupportedNode]));

        mockIsProtonDocsDocument.mockImplementation((mediaType: string) => mediaType === 'application/proton-docs');
        mockIsProtonDocsSpreadsheet.mockReturnValue(false);

        const result = await hydrateAndCheckNodes(['uid-1', 'uid-2']);

        expect(iterateNodes).toHaveBeenCalledWith(['uid-1', 'uid-2']);
        expect(mockIsProtonDocsDocument).toHaveBeenNthCalledWith(1, supportedNode.mediaType);
        expect(mockIsProtonDocsDocument).toHaveBeenNthCalledWith(2, unsupportedNode.mediaType);
        expect(result).toEqual({ nodes: [supportedNode, unsupportedNode], containsUnsupportedFile: true });
    });

    it('throws when a requested node is missing', async () => {
        const iterateNodes = jest.fn();
        const drive = { iterateNodes };
        mockGetDrive.mockReturnValue(drive as unknown as ReturnType<typeof getDrive>);

        const missingNode = { missingUid: 'missing-uid' };
        iterateNodes.mockReturnValue(createAsyncIterable([missingNode]));

        await expect(hydrateAndCheckNodes(['missing-uid'])).rejects.toThrow("Requested item doesn't exist anymore");
    });
});
