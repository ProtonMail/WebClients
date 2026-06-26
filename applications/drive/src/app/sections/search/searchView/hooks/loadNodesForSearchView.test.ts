import { when } from 'jest-when';

import type { ProtonDriveClient } from '@proton/drive/index';
import { getDrive } from '@proton/drive/index';
import { type EffectiveRole, getFormattedNodeLocation, getNodeEffectiveRole } from '@proton/drive/modules/nodes';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { createDebouncedBuffer } from '../../../../utils/createDebouncedBuffer';
import { useSearchViewStore } from '../../searchView/store';
import { loadNodesForSearchView } from './loadNodesForSearchView';

// Use a synchronous pass-through buffer so tests don't need fake timers.
jest.mock('../../../../utils/createDebouncedBuffer', () => ({
    createDebouncedBuffer: jest.fn((flush: (items: unknown[]) => void) => {
        const buffer: unknown[] = [];
        return {
            push: (item: unknown) => buffer.push(item),
            drain: () => {
                if (buffer.length > 0) {
                    flush(buffer.splice(0));
                }
            },
        };
    }),
}));

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
    let mockAddSearchResultItems: jest.Mock;
    let mockAbortSignal: AbortSignal;

    beforeEach(() => {
        jest.clearAllMocks();

        mockCreateNotification = jest.fn();
        mockAddSearchResultItems = jest.fn();
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
            addSearchResultItems: mockAddSearchResultItems,
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

        expect(mockAddSearchResultItems).toHaveBeenCalledWith(
            expect.arrayContaining([
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
            ])
        );
    });

    it('should filter out nodes that are trashed', async () => {
        const trashedNode = createMockNodeEntity({ uid: 'node-1', trashTime: new Date() });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield trashedNode;
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        expect(mockAddSearchResultItems).not.toHaveBeenCalled();
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

        expect(mockAddSearchResultItems).not.toHaveBeenCalled();
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

        expect(mockAddSearchResultItems).not.toHaveBeenCalled();
    });

    it('should handle missing nodes and skip them', async () => {
        const missingNode = { missingUid: 'missing-1' };

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield missingNode;
        });

        await loadNodesForSearchView(['missing-1'], mockAbortSignal);

        expect(mockAddSearchResultItems).not.toHaveBeenCalled();
        expect(mockCreateNotification).not.toHaveBeenCalled();
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

        const allFlushed = mockAddSearchResultItems.mock.calls.flat(2);
        expect(allFlushed).toHaveLength(1);
        expect(allFlushed[0]).toMatchObject({ nodeUid: 'node-1' });
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it('propagates fatal errors from iterateNodes to the caller', async () => {
        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            throw new Error('fatal error');
        });

        await expect(loadNodesForSearchView(['node-1'], mockAbortSignal)).rejects.toThrow('fatal error');
        expect(mockCreateNotification).not.toHaveBeenCalled();
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

        const allFlushed = mockAddSearchResultItems.mock.calls.flat(2);
        expect(allFlushed[0]).toMatchObject({ nodeUid: 'node-1', haveSignatureIssues: true });
    });

    it('should use modificationTime or fallback to creationTime', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1', modificationTime: undefined });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        const allFlushed = mockAddSearchResultItems.mock.calls.flat(2);
        expect(allFlushed[0]).toMatchObject({ modificationTime: mockNode.creationTime });
    });

    it('should include admin role when node has admin role', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1' });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        mockedGetNodeEffectiveRole.mockResolvedValue('admin' as EffectiveRole);

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        const allFlushed = mockAddSearchResultItems.mock.calls.flat(2);
        expect(allFlushed[0]).toMatchObject({ nodeUid: 'node-1', role: 'admin' });
    });

    it('should include editor role when node has editor role', async () => {
        const mockNode = createMockNodeEntity({ uid: 'node-1' });

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            yield mockNode;
        });

        mockedGetNodeEffectiveRole.mockResolvedValue('editor' as EffectiveRole);

        await loadNodesForSearchView(['node-1'], mockAbortSignal);

        const allFlushed = mockAddSearchResultItems.mock.calls.flat(2);
        expect(allFlushed[0]).toMatchObject({ nodeUid: 'node-1', role: 'editor' });
    });

    it('uses createDebouncedBuffer and drains it after all nodes are resolved', async () => {
        const nodes = Array.from({ length: 3 }, (_, i) => createMockNodeEntity({ uid: `node-${i + 1}` }));

        mockDrive.iterateNodes = jest.fn().mockImplementation(async function* () {
            for (const node of nodes) {
                yield node;
            }
        });

        await loadNodesForSearchView(
            nodes.map((n) => n.uid),
            mockAbortSignal
        );

        expect(createDebouncedBuffer).toHaveBeenCalledTimes(1);
        // All 3 nodes flushed via drain() at the end
        expect(mockAddSearchResultItems).toHaveBeenCalledTimes(1);
        expect(mockAddSearchResultItems.mock.calls[0][0]).toHaveLength(3);
    });
});
