import type { Mock } from 'vitest';

import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { BusDriverEventName, getBusDriver } from '@proton/drive/modules/busDriver';
import { getFormattedNodeLocation } from '@proton/drive/modules/nodes';
import { type NodeEntity, getDrivePerNodeType } from '@proton/drive/sdk';

import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { subscribeToSharedByMeEvents } from './subscribeToSharedByMeEvents';
import { getOldestShareCreationTime } from './utils/getOldestShareCreationTime';

vi.mock('@proton/drive/sdk');
vi.mock('@proton/drive/modules/busDriver', async () => ({
    ...(await vi.importActual('@proton/drive/modules/busDriver')),
    getBusDriver: vi.fn(),
}));
vi.mock('@proton/drive/legacy/errorHandling');
vi.mock('@proton/drive/legacy/sdkUtils/getNodeEntity');
vi.mock('@proton/drive/modules/nodes', async () => ({
    ...(await vi.importActual('@proton/drive/modules/nodes')),
    getFormattedNodeLocation: vi.fn(),
}));
vi.mock('../../utils/sdk/getSignatureIssues');
vi.mock('./utils/getOldestShareCreationTime');

const mockGetDrivePerNodeType = vi.mocked(getDrivePerNodeType);
const mockGetBusDriver = vi.mocked(getBusDriver);
const mockHandleSdkError = vi.mocked(handleSdkError);
const mockGetNodeEntity = vi.mocked(getNodeEntity);
const mockGetNodeLocation = vi.mocked(getFormattedNodeLocation);
const mockGetSignatureIssues = vi.mocked(getSignatureIssues);
const mockGetOldestShareCreationTime = vi.mocked(getOldestShareCreationTime);

const mockDrive = {
    getNode: vi.fn(),
    getSharingInfo: vi.fn(),
};

const mockEventManager = {
    subscribe: vi.fn(),
};

const mockStore = {
    getSharedByMeItem: vi.fn(),
    setSharedByMeItem: vi.fn(),
    removeSharedByMeItem: vi.fn(),
};

const createMockNode = (overrides = {}) =>
    ({
        uid: 'node-uid-123',
        name: { ok: true as const, value: 'Test File.pdf' },
        type: 'file',
        mediaType: 'application/pdf',
        deprecatedShareId: 'share-123',
        parentUid: 'parent-uid',
        activeRevision: { ok: true as const, value: { uid: 'revision-uid-123', storageSize: 1024 } },
        totalStorageSize: 2048,
        ...overrides,
    }) as unknown as NodeEntity;

const createMockSharedByMeItem = (overrides = {}) => ({
    nodeUid: 'node-uid-123',
    name: 'Test File.pdf',
    type: 'file',
    mediaType: 'application/pdf',
    size: 1024,
    parentUid: 'parent-uid',
    thumbnailId: 'revision-uid-123',
    location: '/Documents',
    creationTime: new Date('2023-01-15T10:00:00Z'),
    publicLink: undefined,
    haveSignatureIssues: false,
    ...overrides,
});

describe('subscribeToSharedByMeEvents', () => {
    let mockUnsubscribeFunctions: Mock[];

    beforeEach(() => {
        vi.clearAllMocks();

        mockUnsubscribeFunctions = [vi.fn(), vi.fn(), vi.fn()];

        mockGetDrivePerNodeType.mockReturnValue(mockDrive as any);
        mockGetBusDriver.mockReturnValue(mockEventManager as any);

        mockEventManager.subscribe.mockImplementation((eventType) => {
            const index = [
                BusDriverEventName.CREATED_NODES,
                BusDriverEventName.UPDATED_NODES,
                BusDriverEventName.DELETED_NODES,
            ].indexOf(eventType);
            return mockUnsubscribeFunctions[index];
        });

        mockGetNodeEntity.mockReturnValue({
            node: {
                ...createMockNode(),
                name: 'Test File.pdf',
                activeRevision: { uid: 'revision-uid-123', storageSize: 1024 },
            } as any,
            errors: new Map(),
        });
        mockGetSignatureIssues.mockReturnValue({ ok: true });
        mockGetNodeLocation.mockResolvedValue('/My files');
        mockGetOldestShareCreationTime.mockReturnValue(new Date('2023-01-15T10:00:00Z'));
        mockDrive.getNode.mockResolvedValue(createMockNode());
        mockDrive.getSharingInfo.mockResolvedValue({
            urlAccess: {
                numberOfInitializedDownloads: 5,
                url: 'https://proton.me/urls/token#password',
                expirationTime: new Date('2023-12-31T23:59:59Z'),
            },
        });
    });

    it('should subscribe to all required event types', () => {
        subscribeToSharedByMeEvents(() => mockStore);

        expect(mockEventManager.subscribe).toHaveBeenCalledWith(BusDriverEventName.CREATED_NODES, expect.any(Function));
        expect(mockEventManager.subscribe).toHaveBeenCalledWith(BusDriverEventName.UPDATED_NODES, expect.any(Function));
        expect(mockEventManager.subscribe).toHaveBeenCalledWith(BusDriverEventName.DELETED_NODES, expect.any(Function));
    });

    it('should return cleanup function that unsubscribes from all events', () => {
        const cleanup = subscribeToSharedByMeEvents(() => mockStore);

        cleanup();

        mockUnsubscribeFunctions.forEach((unsubscribe) => {
            expect(unsubscribe).toHaveBeenCalled();
        });
    });

    describe('CREATED_NODES event handler', () => {
        let createdNodesHandler: Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents(() => mockStore);
            createdNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.CREATED_NODES
            )![1];
        });

        it('should add new shared items not yet in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    nodeUid: 'node-uid-123',
                    name: 'Test File.pdf',
                })
            );
        });

        it('should not add items that are already in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should not add items that are not shared', async () => {
            const event = {
                items: [{ uid: 'node-uid-123', isShared: false }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should handle errors and not add items when node creation fails', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);
            mockGetNodeEntity.mockImplementation(() => {
                throw new Error('Node fetch failed');
            });

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockHandleSdkError).toHaveBeenCalledWith(expect.any(Error), { showNotification: false });
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });
    });

    describe('UPDATED_NODES event handler', () => {
        let updatedNodesHandler: Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents(() => mockStore);
            updatedNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.UPDATED_NODES
            )![1];
        });

        it('should remove items that are no longer shared', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: false }],
            };

            await updatedNodesHandler(event, mockDrive);

            expect(mockStore.removeSharedByMeItem).toHaveBeenCalledWith('node-uid-123');
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should update items that are shared and already in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await updatedNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    nodeUid: 'node-uid-123',
                    name: 'Test File.pdf',
                })
            );
        });

        it('should not remove items that were not in store and are not shared', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);

            const event = {
                items: [{ uid: 'node-uid-123', isShared: false }],
            };

            await updatedNodesHandler(event, mockDrive);

            expect(mockStore.removeSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should handle errors and not update items when node update fails', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());
            mockGetNodeEntity.mockImplementation(() => {
                throw new Error('Node update failed');
            });

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await updatedNodesHandler(event, mockDrive);

            expect(mockHandleSdkError).toHaveBeenCalledWith(expect.any(Error), { showNotification: false });
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });
    });

    describe('DELETED_NODES event handler', () => {
        let deletedNodesHandler: Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents(() => mockStore);
            deletedNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.DELETED_NODES
            )![1];
        });

        it('should remove deleted items that exist in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                uids: ['node-uid-123', 'node-uid-456'],
            };

            await deletedNodesHandler(event);

            expect(mockStore.removeSharedByMeItem).toHaveBeenCalledWith('node-uid-123');
            expect(mockStore.removeSharedByMeItem).toHaveBeenCalledWith('node-uid-456');
        });

        it('should not remove items that are not in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);

            const event = {
                uids: ['node-uid-123'],
            };

            await deletedNodesHandler(event);

            expect(mockStore.removeSharedByMeItem).not.toHaveBeenCalled();
        });
    });

    describe('createSharedByMeItemFromNode', () => {
        let createdNodesHandler: Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents(() => mockStore);
            createdNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.CREATED_NODES
            )![1];
        });

        it('should create item with public link when available', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    publicLink: {
                        numberOfInitializedDownloads: 5,
                        url: 'https://proton.me/urls/token#password',
                        expirationTime: new Date('2023-12-31T23:59:59Z'),
                    },
                })
            );
        });

        it('should create item without public link when not available', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);
            mockDrive.getSharingInfo.mockResolvedValue({});

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    publicLink: undefined,
                })
            );
        });

        it('should set signature issues when present', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);
            mockGetSignatureIssues.mockReturnValue({
                ok: false,
                issues: {
                    keyAuthor: true,
                    nameAuthor: true,
                    contentAuthor: true,
                },
            });

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event, mockDrive);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    haveSignatureIssues: true,
                })
            );
        });
    });
});
