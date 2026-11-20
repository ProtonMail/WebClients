import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { MemberRole, NodeType, getDrive, getDriveForPhotos } from '@proton/drive/sdk';

import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useSharedByMeStore } from '../useSharedByMe.store';
import { loadSharedByMeNodes } from './loadSharedByMeNodes';

vi.mock('@proton/drive/sdk');
vi.mock('@proton/drive/legacy/errorHandling');
vi.mock('@proton/drive/legacy/sdkUtils/getNodeEntity');
vi.mock('../../../utils/sdk/getSignatureIssues');
vi.mock('../../../utils/sdk/mapNodeToLegacyItem');
vi.mock('../useSharedByMe.store');
vi.mock('@proton/drive/modules/nodes', async () => ({
    ...(await vi.importActual('@proton/drive/modules/nodes')),
    getFormattedNodeLocation: vi.fn().mockResolvedValue('/location'),
    getFormattedNodeLocationUsingHierarchy: vi.fn().mockResolvedValue('/location'),
}));

const mockHandleSdkErrorHandler = vi.mocked(handleSdkError);
const mockGetDrive = vi.mocked(getDrive);
const mockGetDriveForPhotos = vi.mocked(getDriveForPhotos);
const mockGetNodeEntity = vi.mocked(getNodeEntity);
const mockGetSignatureIssues = vi.mocked(getSignatureIssues);
const mockGetRootNode = vi.mocked(getRootNode);
const mockUseSharedByMeStore = vi.mocked(useSharedByMeStore);

const mockDrive = {
    iterateSharedNodeUids: vi.fn(),
    getSharingInfo: vi.fn(),
    getNode: vi.fn(),
    iterateNodes: vi.fn(),
};

const mockSetLoading = vi.fn();
const mockSetSharedByMeItem = vi.fn();
const mockUpdateSharedByMeItem = vi.fn();

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
        vi.clearAllMocks();

        mockGetDrive.mockReturnValue(mockDrive as any);
        mockGetDriveForPhotos.mockReturnValue(mockDrive as any);

        mockUseSharedByMeStore.getState = vi.fn().mockReturnValue({
            isLoading: false,
            setLoading: mockSetLoading,
            setSharedByMeItem: mockSetSharedByMeItem,
            updateSharedByMeItem: mockUpdateSharedByMeItem,
            cleanupStaleItems: vi.fn(),
            sortConfig: undefined,
            sortField: 'name',
            direction: 'asc',
            setSorting: vi.fn(),
        });

        mockGetNodeEntity.mockReturnValue({ node: createMockNode(), errors: new Map() });
        mockGetSignatureIssues.mockReturnValue({ ok: true });
        mockGetRootNode.mockResolvedValue(createMockRootNode());
    });

    describe('loadSharedByMeNodes', () => {
        it('should not execute if already loading', async () => {
            mockUseSharedByMeStore.getState = vi.fn().mockReturnValue({
                isLoading: true,
                setLoading: mockSetLoading,
                setSharedByMeItem: mockSetSharedByMeItem,
                updateSharedByMeItem: mockUpdateSharedByMeItem,
                cleanupStaleItems: vi.fn(),
                sortConfig: undefined,
                sortField: 'name',
                direction: 'asc',
                setSorting: vi.fn(),
            });

            const abortSignal = new AbortController().signal;
            await loadSharedByMeNodes(abortSignal);

            expect(mockSetLoading).not.toHaveBeenCalled();
            expect(mockDrive.iterateSharedNodeUids).not.toHaveBeenCalled();
        });

        it('should set loading state and call iterateSharedNodeUids', async () => {
            mockDrive.iterateSharedNodeUids.mockImplementation(async function* () {
                // Empty generator for basic state testing
            });

            const abortSignal = new AbortController().signal;
            await loadSharedByMeNodes(abortSignal);

            expect(mockSetLoading).toHaveBeenCalledWith(true);
            expect(mockDrive.iterateSharedNodeUids).toHaveBeenCalledWith(abortSignal);
            expect(mockSetLoading).toHaveBeenCalledWith(false);
        });

        it('should handle errors and ensure loading state is reset', async () => {
            const error = new Error('Test error');
            mockDrive.iterateSharedNodeUids.mockImplementation(async function* () {
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

        it('should skip nodes deleted between the listing and the loading without an error', async () => {
            const node = createMockNode();
            mockDrive.getSharingInfo.mockResolvedValue(undefined);
            mockGetDrive.mockReturnValue({
                ...mockDrive,
                iterateSharedNodeUids: vi.fn(async function* () {
                    yield node.uid;
                    yield 'deleted-node';
                }),
                iterateNodes: vi.fn(async function* (uids: string[]) {
                    for (const uid of uids) {
                        yield uid === node.uid ? node : { missingUid: uid };
                    }
                }),
            } as any);
            mockGetDriveForPhotos.mockReturnValue({
                ...mockDrive,
                iterateSharedNodeUids: vi.fn(async function* () {
                    yield* [];
                }),
            } as any);

            await loadSharedByMeNodes(new AbortController().signal);

            expect(mockSetSharedByMeItem).toHaveBeenCalledTimes(1);
            expect(mockSetSharedByMeItem).toHaveBeenCalledWith(expect.objectContaining({ nodeUid: node.uid }));
            expect(mockHandleSdkErrorHandler).not.toHaveBeenCalled();
        });
    });
});
