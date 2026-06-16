import { when } from 'jest-when';

import type { ProtonDriveClient } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { type EffectiveRole, getFormattedNodeLocation, getNodeEffectiveRole } from '@proton/drive/modules/nodes';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { useSearchViewStore } from '../../searchView/store';
import { loadNodesForSearchView } from './loadNodesForSearchView';

jest.mock('@proton/drive/index', () => ({
    ...jest.requireActual('@proton/drive/index'),
    getDrive: jest.fn(),
}));

jest.mock('@proton/drive/modules/notifications', () => ({
    getNotificationsManager: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling');

jest.mock('@proton/drive/modules/nodes', () => ({
    ...jest.requireActual('@proton/drive/modules/nodes'),
    getNodeEffectiveRole: jest.fn(),
    getFormattedNodeLocation: jest.fn(),
}));

const mockedGetDrive = jest.mocked(getDrive);
const mockedGetNotificationsManager = jest.mocked(getNotificationsManager);
const mockedGetFormattedNodeLocation = jest.mocked(getFormattedNodeLocation);
const mockedGetNodeEffectiveRole = jest.mocked(getNodeEffectiveRole);

describe('loadNodesForSearchView', () => {
    let mockDrive: Partial<ProtonDriveClient>;
    let mockCreateNotification: jest.Mock;
    let mockHandleError: jest.Mock;
    let mockSetSearchResultItems: jest.Mock;
    let mockSetLoading: jest.Mock;
    let mockCleanupStaleItems: jest.Mock;
    let mockMarkStoreAsDirty: jest.Mock;
    let mockAbortSignal: AbortSignal;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCreateNotification = jest.fn();
        mockHandleError = jest.fn();
        mockSetSearchResultItems = jest.fn();
        mockSetLoading = jest.fn();
        mockCleanupStaleItems = jest.fn();
        mockMarkStoreAsDirty = jest.fn();
        mockAbortSignal = new AbortController().signal;

        mockDrive = {
            iterateNodes: jest.fn(),
            getNode: jest.fn(),
        };

        mockedGetDrive.mockReturnValue(mockDrive as ProtonDriveClient);

        mockedGetNotificationsManager.mockReturnValue({
            createNotification: mockCreateNotification,
        } as any);

        jest.spyOn(useSearchViewStore, 'getState').mockReturnValue({
            setSearchResultItems: mockSetSearchResultItems,
            setLoading: mockSetLoading,
            cleanupStaleItems: mockCleanupStaleItems,
            markStoreAsDirty: mockMarkStoreAsDirty,
        } as any);

        mockedGetFormattedNodeLocation.mockResolvedValue('/some/location');
        mockedGetNodeEffectiveRole.mockResolvedValue('viewer' as EffectiveRole);
    });

    it('should successfully load nodes and add them to the store', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1' });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetLoading).toHaveBeenCalledWith(true);
        expect(mockSetSearchResultItems).toHaveBeenCalledWith([
            expect.objectContaining({
                nodeUid: 'node-1',
                name: 'mock-file.txt',
                type: mockNode.type,
                role: 'viewer',
                mediaType: mockNode.mediaType,
                activeRevisionUid: expect.any(String),
                size: mockNode.totalStorageSize,
                modificationTime: mockNode.modificationTime,
                location: '/some/location',
                haveSignatureIssues: false,
            }),
        ]);
        expect(mockCleanupStaleItems).toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
    });

    it('should filter out nodes that are trashed', async () => {
        const trashedNode = createMockNodeEntity({ uid: 'node-1', trashTime: new Date() });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield trashedNode;
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
    });

    it('should filter out nodes whose parent is trashed', async () => {
        const childNode = createMockNodeEntity({ uid: 'child-1', parentUid: 'parent-1' });
        const parentNode = createMockNodeEntity({ uid: 'parent-1', trashTime: new Date() });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield childNode;
        });

        when(mockDrive.getNode as jest.Mock)
            .calledWith('parent-1')
            .mockResolvedValue(parentNode);

        await loadNodesForSearchView(['child-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
    });

    it('should filter out nodes whose grandparent is trashed', async () => {
        const childNode = createMockNodeEntity({ uid: 'child-1', parentUid: 'parent-1' });
        const parentNode = createMockNodeEntity({ uid: 'parent-1', parentUid: 'grandparent-1' });
        const grandparentNode = createMockNodeEntity({ uid: 'grandparent-1', trashTime: new Date() });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield childNode;
        });

        when(mockDrive.getNode as jest.Mock)
            .calledWith('parent-1')
            .mockResolvedValue(parentNode);
        when(mockDrive.getNode as jest.Mock)
            .calledWith('grandparent-1')
            .mockResolvedValue(grandparentNode);

        await loadNodesForSearchView(['child-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
    });

    it('should handle missing nodes and skip them', async () => {
        const missingNode = { missingUid: 'missing-1' };

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield missingNode;
        });

        await loadNodesForSearchView(['missing-1'], mockAbortSignal);

        expect(mockHandleError).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
    });

    it('should handle multiple nodes including some missing and some trashed', async () => {
        const validNode = createMockNodeEntity({ uid: 'node-1' });
        const trashedNode = createMockNodeEntity({ uid: 'node-2', trashTime: new Date() });
        const missingNode = { missingUid: 'node-3' };

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield validNode;
            yield trashedNode;
            yield missingNode;
        });

        await loadNodesForSearchView(['node-1', 'node-2', 'node-3'], mockAbortSignal);

        // Only the valid node should be added
        expect(mockSetSearchResultItems).toHaveBeenCalledTimes(1);
        expect(mockSetSearchResultItems).toHaveBeenCalledWith([
            expect.objectContaining({
                nodeUid: 'node-1',
            }),
        ]);
        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockMarkStoreAsDirty).toHaveBeenCalledWith(false);
    });

    it('should handle errors during iteration and not show notification if error should be tracked', async () => {
        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            throw new Error('Abort error');
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockHandleError).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
        expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle nodes with signature issues', async () => {
        const mockNode = createMockNodeEntity({
            uid: 'node-1',
            keyAuthor: {
                ok: false,
                error: { claimedAuthor: 'author@test.com', error: 'Unverified author error' },
            },
        });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).toHaveBeenCalledWith([
            expect.objectContaining({
                nodeUid: 'node-1',
                haveSignatureIssues: true,
            }),
        ]);
    });

    it('should use modificationTime or fallback to creationTime', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1', modificationTime: undefined });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).toHaveBeenCalledWith([
            expect.objectContaining({
                modificationTime: mockNode.creationTime,
            }),
        ]);
    });

    it('should cleanup stale items with loaded uids', async () => {
        const mockNode1 = createMockNodeEntity({ uid: 'node-1' });
        const mockNode2 = createMockNodeEntity({ uid: 'node-2' });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode1;
            yield mockNode2;
        });

        await loadNodesForSearchView(['node-1', 'node-2'], mockAbortSignal);

        const loadedUids = mockCleanupStaleItems.mock.calls[0][0];
        expect(loadedUids).toBeInstanceOf(Set);
        expect(loadedUids.has('node-1')).toBe(true);
        expect(loadedUids.has('node-2')).toBe(true);
    });

    it('should not include trashed or missing nodes in cleanup', async () => {
        const validNode = createMockNodeEntity({ uid: 'node-1' });
        const trashedNode = createMockNodeEntity({ uid: 'node-2', trashTime: new Date() });
        const missingNode = { missingUid: 'node-3' };

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield validNode;
            yield trashedNode;
            yield missingNode;
        });

        await loadNodesForSearchView(['node-1', 'node-2', 'node-3'], mockAbortSignal);

        expect(mockSetLoading).toHaveBeenCalledWith(false);

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

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetLoading).toHaveBeenCalledWith(true);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should include admin role when node has admin role', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1' });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        mockedGetNodeEffectiveRole.mockResolvedValue('admin' as EffectiveRole);

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).toHaveBeenCalledWith([
            expect.objectContaining({
                nodeUid: 'node-1',
                role: 'admin',
            }),
        ]);
    });

    it('should include editor role when node has editor role', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1' });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        mockedGetNodeEffectiveRole.mockResolvedValue('editor' as EffectiveRole);

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockSetSearchResultItems).toHaveBeenCalledWith([
            expect.objectContaining({
                nodeUid: 'node-1',
                role: 'editor',
            }),
        ]);
    });
});
