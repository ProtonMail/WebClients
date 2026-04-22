import type { NodeEntity } from '@protontech/drive-sdk';

import { getBusDriver } from './BusDriver';
import type {
    AcceptInvitationsEvent,
    BusDriverClient,
    CreatedNodesEvent,
    DeleteBookmarksEvent,
    RefreshShareWithMeEvent,
    RejectInvitationsEvent,
    TrashedNodesEvent,
} from './BusDriverTypes';
import { BusDriverEventName } from './BusDriverTypes';

const mockDriveClient = {} as BusDriverClient;

jest.mock('@proton/shared/lib/helpers/promise', () => {
    const actual = jest.requireActual('@proton/shared/lib/helpers/promise');
    return {
        ...actual,
        wait: jest.fn(() => Promise.resolve()),
    };
});

jest.mock('./errorHandling', () => {
    const actual = jest.requireActual('./errorHandling');
    return {
        ...actual,
        sendErrorReport: jest.fn(),
        handleSdkError: jest.fn(),
    };
});

const mockDispose = jest.fn();
const mockSubscribeToTreeEvents = jest.fn();

jest.mock('../..', () => ({
    getDrive: jest.fn(() => ({
        subscribeToTreeEvents: mockSubscribeToTreeEvents,
    })),
    DriveEventType: {
        NodeCreated: 'NodeCreated',
        NodeUpdated: 'NodeUpdated',
        NodeDeleted: 'NodeDeleted',
        SharedWithMeUpdated: 'SharedWithMeUpdated',
    },
}));

const mockNodeEntity: NodeEntity = {
    uid: 'test-node-uid',
    name: 'test-node',
    type: 'folder',
} as NodeEntity;

describe('BusDriver', () => {
    let eventBus: ReturnType<typeof getBusDriver>;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        eventBus = getBusDriver();
        eventBus.clear();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        eventBus.clear();
        consoleWarnSpy.mockRestore();
    });

    describe('subscribe and emit', () => {
        it('should call listener when event is emitted', async () => {
            const mockListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, mockListener);
            await eventBus.emit(testEvent, mockDriveClient);

            expect(mockListener).toHaveBeenCalledWith(testEvent, mockDriveClient);
            expect(mockListener).toHaveBeenCalledTimes(1);
        });

        it('should call multiple listeners for the same event type', async () => {
            const mockListener1 = jest.fn().mockResolvedValue(undefined);
            const mockListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, mockListener1);
            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, mockListener2);
            await eventBus.emit(testEvent, mockDriveClient);

            expect(mockListener1).toHaveBeenCalledWith(testEvent, mockDriveClient);
            expect(mockListener2).toHaveBeenCalledWith(testEvent, mockDriveClient);
        });

        it('should only call listeners for the correct event type', async () => {
            const trashListener = jest.fn().mockResolvedValue(undefined);
            const createListener = jest.fn().mockResolvedValue(undefined);
            const trashEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, trashListener);
            eventBus.subscribe(BusDriverEventName.CREATED_NODES, createListener);
            await eventBus.emit(trashEvent, mockDriveClient);

            expect(trashListener).toHaveBeenCalledWith(trashEvent, mockDriveClient);
            expect(createListener).not.toHaveBeenCalled();
        });
    });

    describe('unsubscribe', () => {
        it('should remove listener when unsubscribed', async () => {
            const mockListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe = eventBus.subscribe(BusDriverEventName.TRASHED_NODES, mockListener);
            unsubscribe();
            await eventBus.emit(testEvent, mockDriveClient);

            expect(mockListener).not.toHaveBeenCalled();
        });

        it('should only remove the specific listener', async () => {
            const mockListener1 = jest.fn().mockResolvedValue(undefined);
            const mockListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe1 = eventBus.subscribe(BusDriverEventName.TRASHED_NODES, mockListener1);
            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, mockListener2);
            unsubscribe1();
            await eventBus.emit(testEvent, mockDriveClient);

            expect(mockListener1).not.toHaveBeenCalled();
            expect(mockListener2).toHaveBeenCalledWith(testEvent, mockDriveClient);
        });
    });

    describe('event type enforcement', () => {
        it('should handle different event shapes correctly', async () => {
            const trashListener = jest.fn().mockResolvedValue(undefined);
            const createListener = jest.fn().mockResolvedValue(undefined);
            const bookmarkDeleteListener = jest.fn().mockResolvedValue(undefined);
            const acceptInvitationListener = jest.fn().mockResolvedValue(undefined);
            const rejectInvitationListener = jest.fn().mockResolvedValue(undefined);

            const trashEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const createEvent: CreatedNodesEvent = {
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: mockNodeEntity.uid, parentUid: undefined }],
            };

            const deleteBookmarkEvent: DeleteBookmarksEvent = {
                type: BusDriverEventName.DELETE_BOOKMARKS,
                uids: ['bookmark-1'],
            };

            const acceptInvitationEvent: AcceptInvitationsEvent = {
                type: BusDriverEventName.ACCEPT_INVITATIONS,
                uids: [mockNodeEntity.uid],
            };

            const rejectInvitationEvent: RejectInvitationsEvent = {
                type: BusDriverEventName.REJECT_INVITATIONS,
                uids: ['invitation-1'],
            };

            const refreshShareWithMeEvent: RefreshShareWithMeEvent = {
                type: BusDriverEventName.REFRESH_SHARED_WITH_ME,
            };

            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, trashListener);
            eventBus.subscribe(BusDriverEventName.CREATED_NODES, createListener);
            eventBus.subscribe(BusDriverEventName.DELETE_BOOKMARKS, bookmarkDeleteListener);
            eventBus.subscribe(BusDriverEventName.ACCEPT_INVITATIONS, acceptInvitationListener);
            eventBus.subscribe(BusDriverEventName.REJECT_INVITATIONS, rejectInvitationListener);

            await eventBus.emit(trashEvent, mockDriveClient);
            await eventBus.emit(createEvent, mockDriveClient);
            await eventBus.emit(deleteBookmarkEvent, mockDriveClient);
            await eventBus.emit(acceptInvitationEvent, mockDriveClient);
            await eventBus.emit(rejectInvitationEvent, mockDriveClient);
            await eventBus.emit(refreshShareWithMeEvent, mockDriveClient);

            expect(trashListener).toHaveBeenCalledWith(trashEvent, mockDriveClient);
            expect(createListener).toHaveBeenCalledWith(createEvent, mockDriveClient);
            expect(bookmarkDeleteListener).toHaveBeenCalledWith(deleteBookmarkEvent, mockDriveClient);
            expect(acceptInvitationListener).toHaveBeenCalledWith(acceptInvitationEvent, mockDriveClient);
            expect(rejectInvitationListener).toHaveBeenCalledWith(rejectInvitationEvent, mockDriveClient);
        });
    });

    describe('error handling', () => {
        it('should handle listener errors gracefully', async () => {
            const errorListener = jest.fn().mockRejectedValue(new Error('Test error'));
            const successListener = jest.fn().mockResolvedValue(undefined);

            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, errorListener);
            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, successListener);

            await expect(eventBus.emit(testEvent, mockDriveClient)).resolves.not.toThrow();
            expect(errorListener).toHaveBeenCalled();
            expect(successListener).toHaveBeenCalled();
        });
    });

    describe('BusDriverEventName.ALL subscription', () => {
        it('should call ALL listener for any event type', async () => {
            const allListener = jest.fn().mockResolvedValue(undefined);
            const trashEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };
            const createEvent: CreatedNodesEvent = {
                type: BusDriverEventName.CREATED_NODES,
                items: [{ uid: mockNodeEntity.uid, parentUid: undefined }],
            };
            const bookmarkEvent: DeleteBookmarksEvent = {
                type: BusDriverEventName.DELETE_BOOKMARKS,
                uids: ['bookmark1'],
            };

            const acceptInvitationEvent: AcceptInvitationsEvent = {
                type: BusDriverEventName.ACCEPT_INVITATIONS,
                uids: [mockNodeEntity.uid],
            };

            const rejectInvitationEvent: RejectInvitationsEvent = {
                type: BusDriverEventName.REJECT_INVITATIONS,
                uids: ['invitation1'],
            };

            const refreshShareWithMeEvent: RefreshShareWithMeEvent = {
                type: BusDriverEventName.REFRESH_SHARED_WITH_ME,
            };

            eventBus.subscribe(BusDriverEventName.ALL, allListener);
            await eventBus.emit(trashEvent, mockDriveClient);
            await eventBus.emit(createEvent, mockDriveClient);
            await eventBus.emit(bookmarkEvent, mockDriveClient);
            await eventBus.emit(acceptInvitationEvent, mockDriveClient);
            await eventBus.emit(rejectInvitationEvent, mockDriveClient);
            await eventBus.emit(refreshShareWithMeEvent, mockDriveClient);

            expect(allListener).toHaveBeenCalledTimes(6);
            expect(allListener).toHaveBeenCalledWith(trashEvent, mockDriveClient);
            expect(allListener).toHaveBeenCalledWith(createEvent, mockDriveClient);
            expect(allListener).toHaveBeenCalledWith(bookmarkEvent, mockDriveClient);
            expect(allListener).toHaveBeenCalledWith(acceptInvitationEvent, mockDriveClient);
            expect(allListener).toHaveBeenCalledWith(rejectInvitationEvent, mockDriveClient);
            expect(allListener).toHaveBeenCalledWith(refreshShareWithMeEvent, mockDriveClient);
        });

        it('should call both specific and ALL listeners when event is emitted', async () => {
            const specificListener = jest.fn().mockResolvedValue(undefined);
            const allListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(BusDriverEventName.TRASHED_NODES, specificListener);
            eventBus.subscribe(BusDriverEventName.ALL, allListener);
            await eventBus.emit(testEvent, mockDriveClient);

            expect(specificListener).toHaveBeenCalledWith(testEvent, mockDriveClient);
            expect(allListener).toHaveBeenCalledWith(testEvent, mockDriveClient);
            expect(specificListener).toHaveBeenCalledTimes(1);
            expect(allListener).toHaveBeenCalledTimes(1);
        });

        it('should be able to unsubscribe from ALL events', async () => {
            const allListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe = eventBus.subscribe(BusDriverEventName.ALL, allListener);
            unsubscribe();
            await eventBus.emit(testEvent, mockDriveClient);

            expect(allListener).not.toHaveBeenCalled();
        });

        it('should handle multiple ALL listeners', async () => {
            const allListener1 = jest.fn().mockResolvedValue(undefined);
            const allListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(BusDriverEventName.ALL, allListener1);
            eventBus.subscribe(BusDriverEventName.ALL, allListener2);
            await eventBus.emit(testEvent, mockDriveClient);

            expect(allListener1).toHaveBeenCalledWith(testEvent, mockDriveClient);
            expect(allListener2).toHaveBeenCalledWith(testEvent, mockDriveClient);
        });

        it('should only remove specific ALL listener when unsubscribed', async () => {
            const allListener1 = jest.fn().mockResolvedValue(undefined);
            const allListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: BusDriverEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe1 = eventBus.subscribe(BusDriverEventName.ALL, allListener1);
            eventBus.subscribe(BusDriverEventName.ALL, allListener2);
            unsubscribe1();
            await eventBus.emit(testEvent, mockDriveClient);

            expect(allListener1).not.toHaveBeenCalled();
            expect(allListener2).toHaveBeenCalledWith(testEvent, mockDriveClient);
        });
    });

    describe('subscription context management', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            mockDispose.mockClear();
            mockSubscribeToTreeEvents.mockClear();
            mockSubscribeToTreeEvents.mockResolvedValue({ dispose: mockDispose });
        });

        it('should handle basic subscription lifecycle', () => {
            const scopeId = 'test-scope-123';
            const key = `drive:${scopeId}`;

            eventBus.subscribeSdkEventsScope(scopeId, 'context1');
            eventBus.subscribeSdkEventsScope(scopeId, 'context2');

            expect(mockSubscribeToTreeEvents).toHaveBeenCalledTimes(1);
            expect(mockSubscribeToTreeEvents).toHaveBeenCalledWith(scopeId, expect.any(Function));

            // We do as any as the property is private
            expect((eventBus as any).treeEventSubscriptions.size).toBe(1);
            expect((eventBus as any).treeEventSubscriptions.get(key)?.contexts.size).toBe(2);
        });

        it('should track contexts correctly', async () => {
            const scopeId = 'test-scope-123';
            const key = `drive:${scopeId}`;

            eventBus.subscribeSdkEventsScope(scopeId, 'context1');
            eventBus.subscribeSdkEventsScope(scopeId, 'context2');
            const subscription = (eventBus as any).treeEventSubscriptions.get(key);

            expect(subscription?.contexts.has('context1')).toBe(true);
            expect(subscription?.contexts.has('context2')).toBe(true);
            expect(subscription?.contexts.size).toBe(2);

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context1');

            expect((eventBus as any).treeEventSubscriptions.has(key)).toBe(true);
            expect((eventBus as any).treeEventSubscriptions.get(key)?.contexts.size).toBe(1);
            expect(mockDispose).not.toHaveBeenCalled();

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context2');

            expect((eventBus as any).treeEventSubscriptions.has(key)).toBe(false);
            expect(mockDispose).toHaveBeenCalledTimes(1);
        });

        it('should only dispose when all contexts are removed', async () => {
            const scopeId = 'test-scope-123';
            const key = `drive:${scopeId}`;

            eventBus.subscribeSdkEventsScope(scopeId, 'context1');
            eventBus.subscribeSdkEventsScope(scopeId, 'context2');

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context1');

            expect((eventBus as any).treeEventSubscriptions.has(key)).toBe(true);
            expect((eventBus as any).treeEventSubscriptions.get(key)?.contexts.size).toBe(1);
            expect(mockDispose).not.toHaveBeenCalled();

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context2');

            expect((eventBus as any).treeEventSubscriptions.has(key)).toBe(false);
            expect(mockDispose).toHaveBeenCalledTimes(1);
        });

        it('should handle unsubscribing non-existent context gracefully', async () => {
            await expect(eventBus.unsubscribeSdkEventsScope('non-existent-scope', 'context1')).resolves.not.toThrow();
            expect(mockDispose).not.toHaveBeenCalled();
        });

        it('should create separate subscriptions for different scopes', () => {
            eventBus.subscribeSdkEventsScope('scope1', 'context1');
            eventBus.subscribeSdkEventsScope('scope2', 'context2');

            expect(mockSubscribeToTreeEvents).toHaveBeenCalledTimes(2);
            expect(mockSubscribeToTreeEvents).toHaveBeenCalledWith('scope1', expect.any(Function));
            expect(mockSubscribeToTreeEvents).toHaveBeenCalledWith('scope2', expect.any(Function));

            expect((eventBus as any).treeEventSubscriptions.size).toBe(2);
            expect((eventBus as any).treeEventSubscriptions.has('drive:scope1')).toBe(true);
            expect((eventBus as any).treeEventSubscriptions.has('drive:scope2')).toBe(true);
        });
    });

    describe('handleSdkEvent', () => {
        let eventBus: ReturnType<typeof getBusDriver>;
        let emitInternalSpy: jest.SpyInstance;

        beforeEach(() => {
            eventBus = getBusDriver();
            eventBus.clear();
            emitInternalSpy = jest.spyOn(eventBus as any, 'emitInternal');
        });

        afterEach(() => {
            emitInternalSpy.mockRestore();
        });

        it('should handle NodeCreated SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeCreated',
                nodeUid: 'node-123',
                parentNodeUid: 'parent-456',
                isTrashed: false,
                isShared: true,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);

            expect(emitInternalSpy).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [
                        {
                            uid: 'node-123',
                            parentUid: 'parent-456',
                            isTrashed: false,
                            isShared: true,
                        },
                    ],
                },
                mockDriveClient
            );
            expect(emitInternalSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle NodeUpdated SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeUpdated',
                nodeUid: 'node-789',
                parentNodeUid: 'parent-101',
                isTrashed: true,
                isShared: false,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);

            expect(emitInternalSpy).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.UPDATED_NODES,
                    items: [
                        {
                            uid: 'node-789',
                            parentUid: 'parent-101',
                            isTrashed: true,
                            isShared: false,
                        },
                    ],
                },
                mockDriveClient
            );
            expect(emitInternalSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle NodeDeleted SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeDeleted',
                nodeUid: 'deleted-node-123',
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);

            expect(emitInternalSpy).toHaveBeenCalledWith(
                { type: BusDriverEventName.DELETED_NODES, uids: ['deleted-node-123'] },
                mockDriveClient
            );
            expect(emitInternalSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle SharedWithMeUpdated SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'SharedWithMeUpdated',
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);

            expect(emitInternalSpy).toHaveBeenCalledWith(
                { type: BusDriverEventName.REFRESH_SHARED_WITH_ME },
                mockDriveClient
            );
            expect(emitInternalSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle unknown SDK event types gracefully', async () => {
            const mockDriveEvent = {
                type: 'UnknownEventType',
                nodeUid: 'some-node',
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);

            expect(emitInternalSpy).not.toHaveBeenCalled();
        });

        it('should handle SDK events with undefined parent correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeCreated',
                nodeUid: 'root-node-123',
                parentNodeUid: undefined,
                isTrashed: false,
                isShared: false,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);

            expect(emitInternalSpy).toHaveBeenCalledWith(
                {
                    type: BusDriverEventName.CREATED_NODES,
                    items: [
                        {
                            uid: 'root-node-123',
                            parentUid: undefined,
                            isTrashed: false,
                            isShared: false,
                        },
                    ],
                },
                mockDriveClient
            );
        });

        it('should handle errors in handleSdkEvent and report them', async () => {
            emitInternalSpy.mockRejectedValue(new Error('Emit failed'));

            const mockDriveEvent = {
                type: 'NodeCreated',
                nodeUid: 'node-123',
                parentNodeUid: 'parent-456',
                isTrashed: false,
                isShared: false,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent, mockDriveClient);
        });
    });
});
