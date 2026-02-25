import { type NodeEntity, getDrivePerNodeType } from '@proton/drive';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getFormattedNodeLocation } from '../../utils/sdk/getNodeLocation';
import { getSignatureIssues } from '../../utils/sdk/getSignatureIssues';
import { getRootNode } from '../../utils/sdk/mapNodeToLegacyItem';
import { subscribeToSharedByMeEvents } from './subscribeToSharedByMeEvents';
import { useSharedByMeStore } from './useSharedByMe.store';
import { getOldestShareCreationTime } from './utils/getOldestShareCreationTime';

jest.mock('@proton/drive');
jest.mock('@proton/drive/internal/BusDriver', () => ({
    ...jest.requireActual('@proton/drive/internal/BusDriver'),
    getBusDriver: jest.fn(),
}));
jest.mock('../../utils/errorHandling/handleSdkError');
jest.mock('../../utils/sdk/getNodeEntity');
jest.mock('../../utils/sdk/getNodeLocation');
jest.mock('../../utils/sdk/getSignatureIssues');
jest.mock('../../utils/sdk/mapNodeToLegacyItem');
jest.mock('./useSharedByMe.store');
jest.mock('./utils/getOldestShareCreationTime');

const mockGetDrivePerNodeType = jest.mocked(getDrivePerNodeType);
const mockGetBusDriver = jest.mocked(getBusDriver);
const mockHandleSdkError = jest.mocked(handleSdkError);
const mockGetNodeEntity = jest.mocked(getNodeEntity);
const mockGetNodeLocation = jest.mocked(getFormattedNodeLocation);
const mockGetSignatureIssues = jest.mocked(getSignatureIssues);
const mockGetRootNode = jest.mocked(getRootNode);
const mockUseSharedByMeStore = jest.mocked(useSharedByMeStore);
const mockGetOldestShareCreationTime = jest.mocked(getOldestShareCreationTime);

const mockDrive = {
    getNode: jest.fn(),
    getSharingInfo: jest.fn(),
};

const mockEventManager = {
    subscribe: jest.fn(),
};

const mockStore = {
    getSharedByMeItem: jest.fn(),
    setSharedByMeItem: jest.fn(),
    removeSharedByMeItem: jest.fn(),
};

const createMockNode = (overrides = {}) =>
    ({
        uid: 'node-uid-123',
        name: 'Test File.pdf',
        type: 'file',
        mediaType: 'application/pdf',
        deprecatedShareId: 'share-123',
        parentUid: 'parent-uid',
        activeRevision: {
            uid: 'revision-uid-123',
            storageSize: 1024,
        },
        totalStorageSize: 2048,
        ...overrides,
    }) as NodeEntity;

const createMockRootNode = () =>
    ({
        uid: 'root-uid',
        deprecatedShareId: 'root-share-123',
    }) as NodeEntity;

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
    shareId: 'share-123',
    rootShareId: 'root-share-123',
    haveSignatureIssues: false,
    ...overrides,
});

describe('subscribeToSharedByMeEvents', () => {
    let mockUnsubscribeFunctions: jest.Mock[];

    beforeEach(() => {
        jest.clearAllMocks();

        mockUnsubscribeFunctions = [jest.fn(), jest.fn(), jest.fn()];

        mockGetDrivePerNodeType.mockReturnValue(mockDrive as any);
        mockGetBusDriver.mockReturnValue(mockEventManager as any);
        mockUseSharedByMeStore.getState = jest.fn().mockReturnValue(mockStore);

        mockEventManager.subscribe.mockImplementation((eventType) => {
            const index = [
                BusDriverEventName.CREATED_NODES,
                BusDriverEventName.UPDATED_NODES,
                BusDriverEventName.DELETED_NODES,
            ].indexOf(eventType);
            return mockUnsubscribeFunctions[index];
        });

        mockGetNodeEntity.mockReturnValue({ node: createMockNode(), errors: new Map() });
        mockGetSignatureIssues.mockReturnValue({ ok: true });
        mockGetNodeLocation.mockResolvedValue('/My files');
        mockGetRootNode.mockResolvedValue(createMockRootNode());
        mockGetOldestShareCreationTime.mockReturnValue(new Date('2023-01-15T10:00:00Z'));
        mockDrive.getNode.mockResolvedValue({ ok: true, value: createMockNode() });
        mockDrive.getSharingInfo.mockResolvedValue({
            publicLink: {
                numberOfInitializedDownloads: 5,
                url: 'https://proton.me/urls/token#password',
                expirationTime: new Date('2023-12-31T23:59:59Z'),
            },
        });
    });

    it('should subscribe to all required event types', () => {
        subscribeToSharedByMeEvents();

        expect(mockEventManager.subscribe).toHaveBeenCalledWith(BusDriverEventName.CREATED_NODES, expect.any(Function));
        expect(mockEventManager.subscribe).toHaveBeenCalledWith(BusDriverEventName.UPDATED_NODES, expect.any(Function));
        expect(mockEventManager.subscribe).toHaveBeenCalledWith(BusDriverEventName.DELETED_NODES, expect.any(Function));
    });

    it('should return cleanup function that unsubscribes from all events', () => {
        const cleanup = subscribeToSharedByMeEvents();

        cleanup();

        mockUnsubscribeFunctions.forEach((unsubscribe) => {
            expect(unsubscribe).toHaveBeenCalled();
        });
    });

    describe('CREATED_NODES event handler', () => {
        let createdNodesHandler: jest.Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents();
            createdNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.CREATED_NODES
            )[1];
        });

        it('should update shared items that are already in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    nodeUid: 'node-uid-123',
                    name: 'Test File.pdf',
                    shareId: 'share-123',
                })
            );
        });

        it('should not add items that are not already in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event);

            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should not add items that are not shared', async () => {
            const event = {
                items: [{ uid: 'node-uid-123', isShared: false }],
            };

            await createdNodesHandler(event);

            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should handle errors and not add items when node creation fails', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());
            mockGetNodeEntity.mockImplementation(() => {
                throw new Error('Node fetch failed');
            });

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event);

            expect(mockHandleSdkError).toHaveBeenCalledWith(expect.any(Error), { showNotification: false });
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });
    });

    describe('UPDATED_NODES event handler', () => {
        let updatedNodesHandler: jest.Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents();
            updatedNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.UPDATED_NODES
            )[1];
        });

        it('should remove items that are no longer shared', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: false }],
            };

            await updatedNodesHandler(event);

            expect(mockStore.removeSharedByMeItem).toHaveBeenCalledWith('node-uid-123');
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });

        it('should update items that are shared and already in store', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await updatedNodesHandler(event);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    nodeUid: 'node-uid-123',
                    name: 'Test File.pdf',
                    shareId: 'share-123',
                })
            );
        });

        it('should not remove items that were not in store and are not shared', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(undefined);

            const event = {
                items: [{ uid: 'node-uid-123', isShared: false }],
            };

            await updatedNodesHandler(event);

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

            await updatedNodesHandler(event);

            expect(mockHandleSdkError).toHaveBeenCalledWith(expect.any(Error), { showNotification: false });
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });
    });

    describe('DELETED_NODES event handler', () => {
        let deletedNodesHandler: jest.Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents();
            deletedNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.DELETED_NODES
            )[1];
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
        let createdNodesHandler: jest.Mock;

        beforeEach(() => {
            subscribeToSharedByMeEvents();
            createdNodesHandler = mockEventManager.subscribe.mock.calls.find(
                (call) => call[0] === BusDriverEventName.CREATED_NODES
            )[1];
        });

        it('should create item with public link when available', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event);

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
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());
            mockDrive.getSharingInfo.mockResolvedValue({});

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    publicLink: undefined,
                })
            );
        });

        it('should set signature issues when present', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());
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

            await createdNodesHandler(event);

            expect(mockStore.setSharedByMeItem).toHaveBeenCalledWith(
                expect.objectContaining({
                    haveSignatureIssues: true,
                })
            );
        });

        it('should handle missing deprecatedShareId', async () => {
            mockStore.getSharedByMeItem.mockReturnValue(createMockSharedByMeItem());
            mockGetNodeEntity.mockReturnValue({
                node: createMockNode({ deprecatedShareId: undefined }),
                errors: new Map(),
            });

            const event = {
                items: [{ uid: 'node-uid-123', isShared: true }],
            };

            await createdNodesHandler(event);

            expect(mockHandleSdkError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'The shared with me node entity is missing deprecatedShareId',
                }),
                { showNotification: false }
            );
            expect(mockStore.setSharedByMeItem).not.toHaveBeenCalled();
        });
    });
});
