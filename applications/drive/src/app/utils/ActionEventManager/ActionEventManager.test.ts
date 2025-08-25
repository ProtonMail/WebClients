import type { NodeEntity } from '@proton/drive/index';

import { getActionEventManager } from './ActionEventManager';
import type {
    AcceptInvitationsEvent,
    CreatedNodesEvent,
    DeleteBookmarksEvent,
    RefreshShareWithMeEvent,
    RejectInvitationsEvent,
    TrashedNodesEvent,
} from './ActionEventManagerTypes';
import { ActionEventName } from './ActionEventManagerTypes';

jest.mock('../errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

jest.mock('../errorHandling/useSdkErrorHandler', () => ({
    handleSdkError: jest.fn(),
}));

const mockDispose = jest.fn();
const mockSubscribeToTreeEvents = jest.fn();

jest.mock('@proton/drive', () => ({
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

describe('ActionEventManager', () => {
    let eventBus: ReturnType<typeof getActionEventManager>;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
        eventBus = getActionEventManager();
        eventBus.clear();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
        eventBus.clear();
        consoleWarnSpy.mockRestore();
    });

    describe('subscribe and emit', () => {
        it('should call listener when event is emitted', async () => {
            const mockListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASHED_NODES, mockListener);
            await eventBus.emit(testEvent);

            expect(mockListener).toHaveBeenCalledWith(testEvent);
            expect(mockListener).toHaveBeenCalledTimes(1);
        });

        it('should call multiple listeners for the same event type', async () => {
            const mockListener1 = jest.fn().mockResolvedValue(undefined);
            const mockListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASHED_NODES, mockListener1);
            eventBus.subscribe(ActionEventName.TRASHED_NODES, mockListener2);
            await eventBus.emit(testEvent);

            expect(mockListener1).toHaveBeenCalledWith(testEvent);
            expect(mockListener2).toHaveBeenCalledWith(testEvent);
        });

        it('should only call listeners for the correct event type', async () => {
            const trashListener = jest.fn().mockResolvedValue(undefined);
            const createListener = jest.fn().mockResolvedValue(undefined);
            const trashEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASHED_NODES, trashListener);
            eventBus.subscribe(ActionEventName.CREATED_NODES, createListener);
            await eventBus.emit(trashEvent);

            expect(trashListener).toHaveBeenCalledWith(trashEvent);
            expect(createListener).not.toHaveBeenCalled();
        });
    });

    describe('unsubscribe', () => {
        it('should remove listener when unsubscribed', async () => {
            const mockListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe = eventBus.subscribe(ActionEventName.TRASHED_NODES, mockListener);
            unsubscribe();
            await eventBus.emit(testEvent);

            expect(mockListener).not.toHaveBeenCalled();
        });

        it('should only remove the specific listener', async () => {
            const mockListener1 = jest.fn().mockResolvedValue(undefined);
            const mockListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe1 = eventBus.subscribe(ActionEventName.TRASHED_NODES, mockListener1);
            eventBus.subscribe(ActionEventName.TRASHED_NODES, mockListener2);
            unsubscribe1();
            await eventBus.emit(testEvent);

            expect(mockListener1).not.toHaveBeenCalled();
            expect(mockListener2).toHaveBeenCalledWith(testEvent);
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
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const createEvent: CreatedNodesEvent = {
                type: ActionEventName.CREATED_NODES,
                items: [{ uid: mockNodeEntity.uid, parentUid: undefined }],
            };

            const deleteBookmarkEvent: DeleteBookmarksEvent = {
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: ['bookmark-1'],
            };

            const acceptInvitationEvent: AcceptInvitationsEvent = {
                type: ActionEventName.ACCEPT_INVITATIONS,
                uids: [mockNodeEntity.uid],
            };

            const rejectInvitationEvent: RejectInvitationsEvent = {
                type: ActionEventName.REJECT_INVITATIONS,
                uids: ['invitation-1'],
            };

            const refreshShareWithMeEvent: RefreshShareWithMeEvent = {
                type: ActionEventName.REFRESH_SHARED_WITH_ME,
            };

            eventBus.subscribe(ActionEventName.TRASHED_NODES, trashListener);
            eventBus.subscribe(ActionEventName.CREATED_NODES, createListener);
            eventBus.subscribe(ActionEventName.DELETE_BOOKMARKS, bookmarkDeleteListener);
            eventBus.subscribe(ActionEventName.ACCEPT_INVITATIONS, acceptInvitationListener);
            eventBus.subscribe(ActionEventName.REJECT_INVITATIONS, rejectInvitationListener);

            await eventBus.emit(trashEvent);
            await eventBus.emit(createEvent);
            await eventBus.emit(deleteBookmarkEvent);
            await eventBus.emit(acceptInvitationEvent);
            await eventBus.emit(rejectInvitationEvent);
            await eventBus.emit(refreshShareWithMeEvent);

            expect(trashListener).toHaveBeenCalledWith(trashEvent);
            expect(createListener).toHaveBeenCalledWith(createEvent);
            expect(bookmarkDeleteListener).toHaveBeenCalledWith(deleteBookmarkEvent);
            expect(acceptInvitationListener).toHaveBeenCalledWith(acceptInvitationEvent);
            expect(rejectInvitationListener).toHaveBeenCalledWith(rejectInvitationEvent);
        });
    });

    describe('error handling', () => {
        it('should handle listener errors gracefully', async () => {
            const errorListener = jest.fn().mockRejectedValue(new Error('Test error'));
            const successListener = jest.fn().mockResolvedValue(undefined);

            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASHED_NODES, errorListener);
            eventBus.subscribe(ActionEventName.TRASHED_NODES, successListener);

            await expect(eventBus.emit(testEvent)).resolves.not.toThrow();
            expect(errorListener).toHaveBeenCalled();
            expect(successListener).toHaveBeenCalled();
        });
    });

    describe('ActionEventName.ALL subscription', () => {
        it('should call ALL listener for any event type', async () => {
            const allListener = jest.fn().mockResolvedValue(undefined);
            const trashEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };
            const createEvent: CreatedNodesEvent = {
                type: ActionEventName.CREATED_NODES,
                items: [{ uid: mockNodeEntity.uid, parentUid: undefined }],
            };
            const bookmarkEvent: DeleteBookmarksEvent = {
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: ['bookmark1'],
            };

            const acceptInvitationEvent: AcceptInvitationsEvent = {
                type: ActionEventName.ACCEPT_INVITATIONS,
                uids: [mockNodeEntity.uid],
            };

            const rejectInvitationEvent: RejectInvitationsEvent = {
                type: ActionEventName.REJECT_INVITATIONS,
                uids: ['invitation1'],
            };

            const refreshShareWithMeEvent: RefreshShareWithMeEvent = {
                type: ActionEventName.REFRESH_SHARED_WITH_ME,
            };

            eventBus.subscribe(ActionEventName.ALL, allListener);
            await eventBus.emit(trashEvent);
            await eventBus.emit(createEvent);
            await eventBus.emit(bookmarkEvent);
            await eventBus.emit(acceptInvitationEvent);
            await eventBus.emit(rejectInvitationEvent);
            await eventBus.emit(refreshShareWithMeEvent);

            expect(allListener).toHaveBeenCalledTimes(6);
            expect(allListener).toHaveBeenCalledWith(trashEvent);
            expect(allListener).toHaveBeenCalledWith(createEvent);
            expect(allListener).toHaveBeenCalledWith(bookmarkEvent);
            expect(allListener).toHaveBeenCalledWith(acceptInvitationEvent);
            expect(allListener).toHaveBeenCalledWith(rejectInvitationEvent);
            expect(allListener).toHaveBeenCalledWith(refreshShareWithMeEvent);
        });

        it('should call both specific and ALL listeners when event is emitted', async () => {
            const specificListener = jest.fn().mockResolvedValue(undefined);
            const allListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASHED_NODES, specificListener);
            eventBus.subscribe(ActionEventName.ALL, allListener);
            await eventBus.emit(testEvent);

            expect(specificListener).toHaveBeenCalledWith(testEvent);
            expect(allListener).toHaveBeenCalledWith(testEvent);
            expect(specificListener).toHaveBeenCalledTimes(1);
            expect(allListener).toHaveBeenCalledTimes(1);
        });

        it('should be able to unsubscribe from ALL events', async () => {
            const allListener = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe = eventBus.subscribe(ActionEventName.ALL, allListener);
            unsubscribe();
            await eventBus.emit(testEvent);

            expect(allListener).not.toHaveBeenCalled();
        });

        it('should handle multiple ALL listeners', async () => {
            const allListener1 = jest.fn().mockResolvedValue(undefined);
            const allListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.ALL, allListener1);
            eventBus.subscribe(ActionEventName.ALL, allListener2);
            await eventBus.emit(testEvent);

            expect(allListener1).toHaveBeenCalledWith(testEvent);
            expect(allListener2).toHaveBeenCalledWith(testEvent);
        });

        it('should only remove specific ALL listener when unsubscribed', async () => {
            const allListener1 = jest.fn().mockResolvedValue(undefined);
            const allListener2 = jest.fn().mockResolvedValue(undefined);
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASHED_NODES,
                uids: ['1'],
            };

            const unsubscribe1 = eventBus.subscribe(ActionEventName.ALL, allListener1);
            eventBus.subscribe(ActionEventName.ALL, allListener2);
            unsubscribe1();
            await eventBus.emit(testEvent);

            expect(allListener1).not.toHaveBeenCalled();
            expect(allListener2).toHaveBeenCalledWith(testEvent);
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

            eventBus.subscribeSdkEventsScope(scopeId, 'context1');
            eventBus.subscribeSdkEventsScope(scopeId, 'context2');

            expect(mockSubscribeToTreeEvents).toHaveBeenCalledTimes(1);
            expect(mockSubscribeToTreeEvents).toHaveBeenCalledWith(scopeId, expect.any(Function));

            // We do as any as the property is private
            expect((eventBus as any).treeEventSubscriptions.size).toBe(1);
            expect((eventBus as any).treeEventSubscriptions.get(scopeId)?.contexts.size).toBe(2);
        });

        it('should track contexts correctly', async () => {
            const scopeId = 'test-scope-123';

            eventBus.subscribeSdkEventsScope(scopeId, 'context1');
            eventBus.subscribeSdkEventsScope(scopeId, 'context2');
            const subscription = (eventBus as any).treeEventSubscriptions.get(scopeId);

            expect(subscription?.contexts.has('context1')).toBe(true);
            expect(subscription?.contexts.has('context2')).toBe(true);
            expect(subscription?.contexts.size).toBe(2);

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context1');

            expect((eventBus as any).treeEventSubscriptions.has(scopeId)).toBe(true);
            expect((eventBus as any).treeEventSubscriptions.get(scopeId)?.contexts.size).toBe(1);
            expect(mockDispose).not.toHaveBeenCalled();

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context2');

            expect((eventBus as any).treeEventSubscriptions.has(scopeId)).toBe(false);
            expect(mockDispose).toHaveBeenCalledTimes(1);
        });

        it('should only dispose when all contexts are removed', async () => {
            const scopeId = 'test-scope-123';

            eventBus.subscribeSdkEventsScope(scopeId, 'context1');
            eventBus.subscribeSdkEventsScope(scopeId, 'context2');

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context1');

            expect((eventBus as any).treeEventSubscriptions.has(scopeId)).toBe(true);
            expect((eventBus as any).treeEventSubscriptions.get(scopeId)?.contexts.size).toBe(1);
            expect(mockDispose).not.toHaveBeenCalled();

            await eventBus.unsubscribeSdkEventsScope(scopeId, 'context2');

            expect((eventBus as any).treeEventSubscriptions.has(scopeId)).toBe(false);
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
            expect((eventBus as any).treeEventSubscriptions.has('scope1')).toBe(true);
            expect((eventBus as any).treeEventSubscriptions.has('scope2')).toBe(true);
        });
    });

    describe('handleSdkEvent', () => {
        let eventBus: ReturnType<typeof getActionEventManager>;
        let emitSpy: jest.SpyInstance;

        beforeEach(() => {
            eventBus = getActionEventManager();
            eventBus.clear();
            emitSpy = jest.spyOn(eventBus, 'emit');
        });

        afterEach(() => {
            emitSpy.mockRestore();
        });

        it('should handle NodeCreated SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeCreated',
                nodeUid: 'node-123',
                parentNodeUid: 'parent-456',
                isTrashed: false,
                isShared: true,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(emitSpy).toHaveBeenCalledWith({
                type: ActionEventName.CREATED_NODES,
                items: [
                    {
                        uid: 'node-123',
                        parentUid: 'parent-456',
                        isTrashed: false,
                        isShared: true,
                    },
                ],
            });
            expect(emitSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle NodeUpdated SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeUpdated',
                nodeUid: 'node-789',
                parentNodeUid: 'parent-101',
                isTrashed: true,
                isShared: false,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(emitSpy).toHaveBeenCalledWith({
                type: ActionEventName.UPDATED_NODES,
                items: [
                    {
                        uid: 'node-789',
                        parentUid: 'parent-101',
                        isTrashed: true,
                        isShared: false,
                    },
                ],
            });
            expect(emitSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle NodeDeleted SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeDeleted',
                nodeUid: 'deleted-node-123',
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(emitSpy).toHaveBeenCalledWith({
                type: ActionEventName.DELETED_NODES,
                uids: ['deleted-node-123'],
            });
            expect(emitSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle SharedWithMeUpdated SDK event correctly', async () => {
            const mockDriveEvent = {
                type: 'SharedWithMeUpdated',
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(emitSpy).toHaveBeenCalledWith({
                type: ActionEventName.REFRESH_SHARED_WITH_ME,
            });
            expect(emitSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle unknown SDK event types gracefully', async () => {
            const mockDriveEvent = {
                type: 'UnknownEventType',
                nodeUid: 'some-node',
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(emitSpy).not.toHaveBeenCalled();
        });

        it('should handle SDK events with undefined parent correctly', async () => {
            const mockDriveEvent = {
                type: 'NodeCreated',
                nodeUid: 'root-node-123',
                parentNodeUid: undefined,
                isTrashed: false,
                isShared: false,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(emitSpy).toHaveBeenCalledWith({
                type: ActionEventName.CREATED_NODES,
                items: [
                    {
                        uid: 'root-node-123',
                        parentUid: undefined,
                        isTrashed: false,
                        isShared: false,
                    },
                ],
            });
        });

        it('should handle errors in handleSdkEvent and report them', async () => {
            const mockSendErrorReport = jest.mocked(require('../errorHandling').sendErrorReport);
            emitSpy.mockRejectedValue(new Error('Emit failed'));

            const mockDriveEvent = {
                type: 'NodeCreated',
                nodeUid: 'node-123',
                parentNodeUid: 'parent-456',
                isTrashed: false,
                isShared: false,
            };

            await (eventBus as any).handleSdkEvent(mockDriveEvent);

            expect(mockSendErrorReport).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Error handling SDK event',
                    context: expect.objectContaining({
                        extra: expect.objectContaining({
                            event: mockDriveEvent,
                            error: expect.any(Error),
                        }),
                    }),
                })
            );
        });
    });
});
