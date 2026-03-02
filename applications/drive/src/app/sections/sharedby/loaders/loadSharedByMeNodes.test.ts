import { MemberRole, NodeType, getDrive, getDriveForPhotos } from '@proton/drive';

import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useSharedByMeStore } from '../useSharedByMe.store';
import { loadSharedByMeNodes } from './loadSharedByMeNodes';

jest.mock('@proton/drive');
jest.mock('../../../utils/errorHandling/handleSdkError');
jest.mock('../../../utils/sdk/getNodeEntity');
jest.mock('../../../utils/sdk/getSignatureIssues');
jest.mock('../../../utils/sdk/mapNodeToLegacyItem');
jest.mock('../useSharedByMe.store');

const mockHandleSdkErrorHandler = jest.mocked(handleSdkError);
const mockGetDrive = jest.mocked(getDrive);
const mockGetDriveForPhotos = jest.mocked(getDriveForPhotos);
const mockGetNodeEntity = jest.mocked(getNodeEntity);
const mockGetSignatureIssues = jest.mocked(getSignatureIssues);
const mockGetRootNode = jest.mocked(getRootNode);
const mockUseSharedByMeStore = jest.mocked(useSharedByMeStore);

const mockDrive = {
    iterateSharedNodes: jest.fn(),
    getSharingInfo: jest.fn(),
    getNode: jest.fn(),
    iterateNodes: jest.fn(),
};

const mockSetLoading = jest.fn();
const mockSetSharedByMeItem = jest.fn();
const mockUpdateSharedByMeItem = jest.fn();

const createMockNode = (overrides = {}) =>
    ({
        uid: 'node-uid-123',
        name: 'Test File.pdf',
        type: NodeType.File,
        mediaType: 'application/pdf',
        deprecatedShareId: 'share-123',
        parentUid: 'parent-uid',
        activeRevision: {
            uid: 'revision-uid-123',
            storageSize: 1024,
        },
        totalStorageSize: 2048,
        keyAuthor: { name: 'key-author' },
        nameAuthor: { name: 'name-author' },
        directRole: MemberRole.Admin,
        isShared: true,
        creationTime: new Date(),
        treeEventScopeId: 'scope-123',
        ...overrides,
    }) as any;

const createMockRootNode = () =>
    ({
        uid: 'root-uid',
        deprecatedShareId: 'root-share-123',
        keyAuthor: { name: 'key-author' },
        nameAuthor: { name: 'name-author' },
        directRole: MemberRole.Admin,
        isShared: false,
        creationTime: new Date(),
        name: 'Root',
        type: NodeType.Folder,
        mediaType: 'folder',
        parentUid: undefined,
        totalStorageSize: 0,
        treeEventScopeId: 'scope-456',
    }) as any;

describe('useSharedByMeNodesLoader', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockGetDrive.mockReturnValue(mockDrive as any);
        mockGetDriveForPhotos.mockReturnValue(mockDrive as any);

        mockUseSharedByMeStore.getState = jest.fn().mockReturnValue({
            isLoading: false,
            setLoading: mockSetLoading,
            setSharedByMeItem: mockSetSharedByMeItem,
            updateSharedByMeItem: mockUpdateSharedByMeItem,
        });

        mockGetNodeEntity.mockReturnValue({ node: createMockNode(), errors: new Map() });
        mockGetSignatureIssues.mockReturnValue({ ok: true });
        mockGetRootNode.mockResolvedValue(createMockRootNode());
    });

    describe('loadSharedByMeNodes', () => {
        it('should not execute if already loading', async () => {
            mockUseSharedByMeStore.getState = jest.fn().mockReturnValue({
                isLoading: true,
                setLoading: mockSetLoading,
                setSharedByMeItem: mockSetSharedByMeItem,
                updateSharedByMeItem: mockUpdateSharedByMeItem,
            });

            const abortSignal = new AbortController().signal;
            await loadSharedByMeNodes(abortSignal);

            expect(mockSetLoading).not.toHaveBeenCalled();
            expect(mockDrive.iterateSharedNodes).not.toHaveBeenCalled();
        });

        it('should set loading state and call iterateSharedNodes', async () => {
            mockDrive.iterateSharedNodes.mockImplementation(async function* () {
                // Empty generator for basic state testing
            });

            const abortSignal = new AbortController().signal;
            await loadSharedByMeNodes(abortSignal);

            expect(mockSetLoading).toHaveBeenCalledWith(true);
            expect(mockDrive.iterateSharedNodes).toHaveBeenCalledWith(abortSignal);
            expect(mockSetLoading).toHaveBeenCalledWith(false);
        });

        it('should handle errors and ensure loading state is reset', async () => {
            const error = new Error('Test error');
            mockDrive.iterateSharedNodes.mockImplementation(async function* () {
                throw error;
            });

            const abortSignal = new AbortController().signal;
            await loadSharedByMeNodes(abortSignal);

            expect(mockHandleSdkErrorHandler).toHaveBeenCalledWith(error, {
                fallbackMessage: 'We were not able to load some of your shared items',
                showNotification: true,
            });
            expect(mockSetLoading).toHaveBeenCalledWith(true);
            expect(mockSetLoading).toHaveBeenCalledWith(false);
        });
    });
});
