import { renderHook } from '@testing-library/react';

import { useNotifications } from '@proton/components';
import { MemberRole, NodeType, getDrive, getDriveForPhotos } from '@proton/drive';

import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useSharedByMeStore } from '../useSharedByMe.store';
import { useSharedByMeNodesLoader } from './useSharedByMeNodesLoader';

jest.mock('@proton/components');
jest.mock('@proton/drive');
jest.mock('../../../utils/errorHandling/useSdkErrorHandler');
jest.mock('../../../utils/sdk/getNodeEntity');
jest.mock('../../../utils/sdk/getSignatureIssues');
jest.mock('../../../utils/sdk/mapNodeToLegacyItem');
jest.mock('../useSharedByMe.store');

const mockUseNotifications = jest.mocked(useNotifications);
const mockUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
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

const mockCreateNotification = jest.fn();
const mockHandleError = jest.fn();
const mockSetLoadingNodes = jest.fn();
const mockSetSharedByMeItem = jest.fn();
const mockUpdateSharedByMeItem = jest.fn();
const mockCleanupStaleItems = jest.fn();

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

        mockUseNotifications.mockReturnValue({ createNotification: mockCreateNotification } as any);
        mockUseSdkErrorHandler.mockReturnValue({ handleError: mockHandleError });
        mockGetDrive.mockReturnValue(mockDrive as any);
        mockGetDriveForPhotos.mockReturnValue(mockDrive as any);

        mockUseSharedByMeStore.getState = jest.fn().mockReturnValue({
            isLoadingNodes: false,
            setLoadingNodes: mockSetLoadingNodes,
            setSharedByMeItem: mockSetSharedByMeItem,
            updateSharedByMeItem: mockUpdateSharedByMeItem,
            cleanupStaleItems: mockCleanupStaleItems,
        });

        mockGetNodeEntity.mockReturnValue({ node: createMockNode(), errors: new Map() });
        mockGetSignatureIssues.mockReturnValue({ ok: true });
        mockGetRootNode.mockResolvedValue(createMockRootNode());
    });

    it('should return loadSharedByMeNodes function', () => {
        const { result } = renderHook(() => useSharedByMeNodesLoader());

        expect(result.current).toEqual({
            loadSharedByMeNodes: expect.any(Function),
        });
    });

    describe('loadSharedByMeNodes', () => {
        it('should not execute if already loading', async () => {
            mockUseSharedByMeStore.getState = jest.fn().mockReturnValue({
                isLoadingNodes: true,
                setLoadingNodes: mockSetLoadingNodes,
                setSharedByMeItem: mockSetSharedByMeItem,
                updateSharedByMeItem: mockUpdateSharedByMeItem,
                cleanupStaleItems: mockCleanupStaleItems,
            });

            const { result } = renderHook(() => useSharedByMeNodesLoader());
            const abortSignal = new AbortController().signal;

            await result.current.loadSharedByMeNodes(abortSignal);

            expect(mockSetLoadingNodes).not.toHaveBeenCalled();
            expect(mockDrive.iterateSharedNodes).not.toHaveBeenCalled();
        });

        it('should set loading state and call iterateSharedNodes', async () => {
            mockDrive.iterateSharedNodes.mockImplementation(async function* () {
                // Empty generator for basic state testing
            });

            const { result } = renderHook(() => useSharedByMeNodesLoader());
            const abortSignal = new AbortController().signal;

            await result.current.loadSharedByMeNodes(abortSignal);

            expect(mockSetLoadingNodes).toHaveBeenCalledWith(true);
            expect(mockDrive.iterateSharedNodes).toHaveBeenCalledWith(abortSignal);
            expect(mockSetLoadingNodes).toHaveBeenCalledWith(false);
        });

        it('should handle errors and ensure loading state is reset', async () => {
            const error = new Error('Test error');
            mockDrive.iterateSharedNodes.mockImplementation(async function* () {
                throw error;
            });

            const { result } = renderHook(() => useSharedByMeNodesLoader());
            const abortSignal = new AbortController().signal;

            await result.current.loadSharedByMeNodes(abortSignal);

            expect(mockHandleError).toHaveBeenCalledWith(error, {
                fallbackMessage: 'We were not able to load some of your shared items',
            });
            expect(mockSetLoadingNodes).toHaveBeenCalledWith(true);
            expect(mockSetLoadingNodes).toHaveBeenCalledWith(false);
        });

        it('should call cleanupStaleItems with empty set when no nodes processed', async () => {
            mockDrive.iterateSharedNodes.mockImplementation(async function* () {
                // Empty generator
            });

            const { result } = renderHook(() => useSharedByMeNodesLoader());
            const abortSignal = new AbortController().signal;

            await result.current.loadSharedByMeNodes(abortSignal);

            expect(mockCleanupStaleItems).toHaveBeenCalledWith(new Set());
        });

        it('should validate dependencies are injected correctly', () => {
            const { result } = renderHook(() => useSharedByMeNodesLoader());

            expect(result.current.loadSharedByMeNodes).toBeDefined();
            expect(mockUseNotifications).toHaveBeenCalled();
            expect(mockUseSdkErrorHandler).toHaveBeenCalled();
        });
    });
});
