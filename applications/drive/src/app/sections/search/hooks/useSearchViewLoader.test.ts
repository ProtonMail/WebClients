import { renderHook, waitFor } from '@testing-library/react';
import { when } from 'jest-when';

// Import mocked modules
import { useNotifications } from '@proton/components';
import type { MaybeNode, ProtonDriveClient } from '@proton/drive/index';
import { useDrive } from '@proton/drive/index';

import { useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import type { EffectiveRole } from '../../../utils/sdk/getNodeEffectiveRole';
import { getNodeEffectiveRole } from '../../../utils/sdk/getNodeEffectiveRole';
import { getFormattedNodeLocation } from '../../../utils/sdk/getNodeLocation';
import { createMockDegradedNode, createMockNodeEntity } from '../../../utils/test/nodeEntity';
import { useSearchViewStore } from '../store';
import { useSearchViewNodesLoader } from './useSearchViewLoader';

// Mock dependencies
jest.mock('@proton/components', () => ({
    useNotifications: jest.fn(),
}));

jest.mock('@proton/drive/index', () => ({
    ...jest.requireActual('@proton/drive/index'),
    useDrive: jest.fn(),
}));

jest.mock('../../../utils/errorHandling/useSdkErrorHandler', () => ({
    ...jest.requireActual('../../../utils/errorHandling/useSdkErrorHandler'),
    useSdkErrorHandler: jest.fn(),
}));

jest.mock('../../../utils/sdk/getNodeLocation', () => ({
    getFormattedNodeLocation: jest.fn(),
}));

jest.mock('../../../utils/sdk/getNodeEffectiveRole', () => ({
    getNodeEffectiveRole: jest.fn(),
}));

const mockedUseNotifications = jest.mocked(useNotifications);
const mockedUseDrive = jest.mocked(useDrive);
const mockedUseSdkErrorHandler = jest.mocked(useSdkErrorHandler);
const mockedGetFormattedNodeLocation = jest.mocked(getFormattedNodeLocation);
const mockedGetNodeEffectiveRole = jest.mocked(getNodeEffectiveRole);

describe('useSearchViewLoader', () => {
    let mockDrive: Partial<ProtonDriveClient>;
    let mockCreateNotification: jest.Mock;
    let mockHandleError: jest.Mock;
    let mockAddSearchResultItem: jest.Mock;
    let mockSetLoading: jest.Mock;
    let mockCleanupStaleItems: jest.Mock;
    let mockMarkStoreAsDirty: jest.Mock;
    let mockAbortSignal: AbortSignal;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCreateNotification = jest.fn();
        mockHandleError = jest.fn();
        mockAddSearchResultItem = jest.fn();
        mockSetLoading = jest.fn();
        mockCleanupStaleItems = jest.fn();
        mockMarkStoreAsDirty = jest.fn();
        mockAbortSignal = new AbortController().signal;

        mockDrive = {
            iterateNodes: jest.fn(),
            getNode: jest.fn(),
        };

        mockedUseNotifications.mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        mockedUseDrive.mockReturnValue({
            drive: mockDrive as ProtonDriveClient,
        } as any);

        mockedUseSdkErrorHandler.mockReturnValue({
            handleError: mockHandleError,
        } as any);

        jest.spyOn(useSearchViewStore, 'getState').mockReturnValue({
            addSearchResultItem: mockAddSearchResultItem,
            setLoading: mockSetLoading,
            cleanupStaleItems: mockCleanupStaleItems,
            markStoreAsDirty: mockMarkStoreAsDirty,
        } as any);

        mockedGetFormattedNodeLocation.mockResolvedValue('/some/location');
        mockedGetNodeEffectiveRole.mockResolvedValue('viewer' as EffectiveRole);
    });

    describe('loadNodes', () => {
        it('should successfully load nodes and add them to the store', async () => {
            const mockNode = createMockNodeEntity({ uid: 'node-1' });
            const mockMaybeNode = { ok: true, value: mockNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(true);
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        nodeUid: 'node-1',
                        name: mockNode.name,
                        type: mockNode.type,
                        role: 'viewer',
                        mediaType: mockNode.mediaType,
                        thumbnailId: mockNode.activeRevision?.uid,
                        size: mockNode.totalStorageSize,
                        modificationTime: mockNode.modificationTime,
                        location: '/some/location',
                        haveSignatureIssues: false,
                    })
                );
                expect(mockCleanupStaleItems).toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
                expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
            });
        });

        it('should filter out nodes that are trashed', async () => {
            const trashedNode = createMockNodeEntity({ uid: 'node-1', trashTime: new Date() });
            const mockMaybeNode = { ok: true, value: trashedNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).not.toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
                expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
            });
        });

        it('should filter out nodes whose parent is trashed', async () => {
            const childNode = createMockNodeEntity({ uid: 'child-1', parentUid: 'parent-1' });
            const parentNode = createMockNodeEntity({ uid: 'parent-1', trashTime: new Date() });
            const mockChildMaybeNode = { ok: true, value: childNode };
            const mockParentMaybeNode = { ok: true, value: parentNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockChildMaybeNode;
            });

            when(mockDrive.getNode as jest.Mock)
                .calledWith('parent-1')
                .mockResolvedValue(mockParentMaybeNode);

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['child-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).not.toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
                expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
            });
        });

        it('should filter out nodes whose grandparent is trashed', async () => {
            const childNode = createMockNodeEntity({ uid: 'child-1', parentUid: 'parent-1' });
            const parentNode = createMockNodeEntity({ uid: 'parent-1', parentUid: 'grandparent-1' });
            const grandparentNode = createMockNodeEntity({ uid: 'grandparent-1', trashTime: new Date() });

            const mockChildMaybeNode = { ok: true, value: childNode };
            const mockParentMaybeNode = { ok: true, value: parentNode };
            const mockGrandparentMaybeNode = { ok: true, value: grandparentNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockChildMaybeNode;
            });

            when(mockDrive.getNode as jest.Mock)
                .calledWith('parent-1')
                .mockResolvedValue(mockParentMaybeNode);
            when(mockDrive.getNode as jest.Mock)
                .calledWith('grandparent-1')
                .mockResolvedValue(mockGrandparentMaybeNode);

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['child-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).not.toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
                expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
            });
        });

        it('should handle missing nodes and skip them', async () => {
            const missingNode = {
                ok: false,
                error: { missingUid: 'missing-1' },
            };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield missingNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['missing-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockHandleError).not.toHaveBeenCalled();
                expect(mockCreateNotification).not.toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
                expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
            });
        });

        it('should handle multiple nodes including some missing and some trashed', async () => {
            const validNode = createMockNodeEntity({ uid: 'node-1' });
            const trashedNode = createMockNodeEntity({ uid: 'node-2', trashTime: new Date() });
            const missingNode = {
                ok: false,
                error: { missingUid: 'node-3' },
            };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield { ok: true, value: validNode };
                yield { ok: true, value: trashedNode };
                yield missingNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1', 'node-2', 'node-3'], mockAbortSignal);

            await waitFor(() => {
                // Only the valid node should be added
                expect(mockAddSearchResultItem).toHaveBeenCalledTimes(1);
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        nodeUid: 'node-1',
                    })
                );
                expect(mockCreateNotification).not.toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
                expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
            });
        });

        it('should handle errors during iteration and not show notification if error should be tracked', async () => {
            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                throw new Error('Abort error');
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockHandleError).not.toHaveBeenCalled();
                expect(mockCreateNotification).not.toHaveBeenCalled();
                expect(mockSetLoading).toHaveBeenCalledWith(false);
            });
        });

        it('should handle nodes with signature issues', async () => {
            const mockNode = createMockDegradedNode({ uid: 'node-1' });
            const mockMaybeNode = {
                ok: false,
                error: {
                    ...mockNode,
                    keyAuthor: {
                        ok: false,
                        error: { error: 'Unverified author error' },
                    },
                },
            } satisfies MaybeNode;

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        nodeUid: 'node-1',
                        haveSignatureIssues: true,
                    })
                );
            });
        });

        it('should use node uid as thumbnailId when activeRevision is not available', async () => {
            const mockNode = createMockNodeEntity({ uid: 'node-1', activeRevision: undefined });
            const mockMaybeNode = { ok: true, value: mockNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        thumbnailId: 'node-1',
                    })
                );
            });
        });

        it('should use modificationTime or fallback to creationTime', async () => {
            const mockNode = createMockNodeEntity({ uid: 'node-1', modificationTime: undefined });
            const mockMaybeNode = { ok: true, value: mockNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        modificationTime: mockNode.creationTime,
                    })
                );
            });
        });

        it('should cleanup stale items with loaded uids', async () => {
            const mockNode1 = createMockNodeEntity({ uid: 'node-1' });
            const mockNode2 = createMockNodeEntity({ uid: 'node-2' });

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield { ok: true, value: mockNode1 };
                yield { ok: true, value: mockNode2 };
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1', 'node-2'], mockAbortSignal);

            await waitFor(() => {
                const loadedUids = mockCleanupStaleItems.mock.calls[0][0];
                expect(loadedUids).toBeInstanceOf(Set);
                expect(loadedUids.has('node-1')).toBe(true);
                expect(loadedUids.has('node-2')).toBe(true);
            });
        });

        it('should not include trashed or missing nodes in cleanup', async () => {
            const validNode = createMockNodeEntity({ uid: 'node-1' });
            const trashedNode = createMockNodeEntity({ uid: 'node-2', trashTime: new Date() });
            const missingNode = {
                ok: false,
                error: { missingUid: 'node-3' },
            };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield { ok: true, value: validNode };
                yield { ok: true, value: trashedNode };
                yield missingNode;
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1', 'node-2', 'node-3'], mockAbortSignal);

            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(false);
            });

            const loadedUids = mockCleanupStaleItems.mock.calls[0][0];
            expect(loadedUids).toBeInstanceOf(Set);
            expect(loadedUids.size).toBe(1);
            expect(loadedUids.has('node-1')).toBe(true);
            expect(loadedUids.has('node-2')).toBe(false);
            expect(loadedUids.has('node-3')).toBe(false);
        });

        it('should always set loading to false even if an error occurs', async () => {
            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                throw new Error('Unexpected error');
            });

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockSetLoading).toHaveBeenCalledWith(true);
                expect(mockSetLoading).toHaveBeenCalledWith(false);
            });
        });

        it('should include admin role when node has admin role', async () => {
            const mockNode = createMockNodeEntity({ uid: 'node-1' });
            const mockMaybeNode = { ok: true, value: mockNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            mockedGetNodeEffectiveRole.mockResolvedValue('admin' as EffectiveRole);

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        nodeUid: 'node-1',
                        role: 'admin',
                    })
                );
            });
        });

        it('should include editor role when node has editor role', async () => {
            const mockNode = createMockNodeEntity({ uid: 'node-1' });
            const mockMaybeNode = { ok: true, value: mockNode };

            mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
                yield mockMaybeNode;
            });

            mockedGetNodeEffectiveRole.mockResolvedValue('editor' as EffectiveRole);

            const { result } = renderHook(() => useSearchViewNodesLoader());

            await result.current.loadNodes(['node-1'], mockAbortSignal);

            await waitFor(() => {
                expect(mockAddSearchResultItem).toHaveBeenCalledWith(
                    expect.objectContaining({
                        nodeUid: 'node-1',
                        role: 'editor',
                    })
                );
            });
        });
    });
});
