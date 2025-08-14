import type { NodeEntity } from '@proton/drive/index';

import { getActionEventManager } from './ActionEventManager';
import type {
    AcceptInvitationsEvent,
    CreatedNodesEvent,
    DeleteBookmarksEvent,
    RejectInvitationsEvent,
    TrashedNodesEvent,
} from './ActionEventManagerTypes';
import { ActionEventName } from './ActionEventManagerTypes';

jest.mock('../errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

const mockNodeEntity: NodeEntity = {
    uid: 'test-node-uid',
    name: 'test-node',
    type: 'folder',
} as NodeEntity;

describe('ActionEventManager', () => {
    let eventBus: ReturnType<typeof getActionEventManager>;

    beforeEach(() => {
        eventBus = getActionEventManager();
        eventBus.clear();
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        eventBus.clear();
        jest.restoreAllMocks();
    });

    describe('subscribe and emit', () => {
        it('should call listener when event is emitted', () => {
            const mockListener = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, mockListener);
            eventBus.emit(testEvent);

            expect(mockListener).toHaveBeenCalledWith(testEvent);
            expect(mockListener).toHaveBeenCalledTimes(1);
        });

        it('should call multiple listeners for the same event type', () => {
            const mockListener1 = jest.fn();
            const mockListener2 = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, mockListener1);
            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, mockListener2);
            eventBus.emit(testEvent);

            expect(mockListener1).toHaveBeenCalledWith(testEvent);
            expect(mockListener2).toHaveBeenCalledWith(testEvent);
        });

        it('should only call listeners for the correct event type', () => {
            const trashListener = jest.fn();
            const createListener = jest.fn();
            const trashEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, trashListener);
            eventBus.subscribe(ActionEventName.CREATED_NODES, createListener);
            eventBus.emit(trashEvent);

            expect(trashListener).toHaveBeenCalledWith(trashEvent);
            expect(createListener).not.toHaveBeenCalled();
        });
    });

    describe('unsubscribe', () => {
        it('should remove listener when unsubscribed', () => {
            const mockListener = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            const unsubscribe = eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, mockListener);
            unsubscribe();
            eventBus.emit(testEvent);

            expect(mockListener).not.toHaveBeenCalled();
        });

        it('should only remove the specific listener', () => {
            const mockListener1 = jest.fn();
            const mockListener2 = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            const unsubscribe1 = eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, mockListener1);
            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, mockListener2);
            unsubscribe1();
            eventBus.emit(testEvent);

            expect(mockListener1).not.toHaveBeenCalled();
            expect(mockListener2).toHaveBeenCalledWith(testEvent);
        });
    });

    describe('event type enforcement', () => {
        it('should handle different event shapes correctly', () => {
            const trashListener = jest.fn();
            const createListener = jest.fn();
            const bookmarkDeleteListener = jest.fn();
            const acceptInvitationListener = jest.fn();
            const rejectInvitationListener = jest.fn();

            const trashEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            const createEvent: CreatedNodesEvent = {
                type: ActionEventName.CREATED_NODES,
                nodes: [mockNodeEntity],
            };

            const deleteBookmarkEvent: DeleteBookmarksEvent = {
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: ['bookmark-1'],
            };

            const acceptInvitationEvent: AcceptInvitationsEvent = {
                type: ActionEventName.ACCEPT_INVITATIONS,
                items: [
                    {
                        node: mockNodeEntity,
                        sharedInfo: { sharedOn: 1234567890, sharedBy: 'test@example.com' },
                    },
                ],
            };

            const rejectInvitationEvent: RejectInvitationsEvent = {
                type: ActionEventName.REJECT_INVITATIONS,
                uids: ['invitation-1'],
            };

            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, trashListener);
            eventBus.subscribe(ActionEventName.CREATED_NODES, createListener);
            eventBus.subscribe(ActionEventName.DELETE_BOOKMARKS, bookmarkDeleteListener);
            eventBus.subscribe(ActionEventName.ACCEPT_INVITATIONS, acceptInvitationListener);
            eventBus.subscribe(ActionEventName.REJECT_INVITATIONS, rejectInvitationListener);

            eventBus.emit(trashEvent);
            eventBus.emit(createEvent);
            eventBus.emit(deleteBookmarkEvent);
            eventBus.emit(acceptInvitationEvent);
            eventBus.emit(rejectInvitationEvent);

            expect(trashListener).toHaveBeenCalledWith(trashEvent);
            expect(createListener).toHaveBeenCalledWith(createEvent);
            expect(bookmarkDeleteListener).toHaveBeenCalledWith(deleteBookmarkEvent);
            expect(acceptInvitationListener).toHaveBeenCalledWith(acceptInvitationEvent);
            expect(rejectInvitationListener).toHaveBeenCalledWith(rejectInvitationEvent);
        });
    });

    describe('error handling', () => {
        it('should handle listener errors gracefully', () => {
            const errorListener = jest.fn(() => {
                throw new Error('Test error');
            });
            const successListener = jest.fn();

            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, errorListener);
            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, successListener);

            expect(() => eventBus.emit(testEvent)).not.toThrow();
            expect(errorListener).toHaveBeenCalled();
            expect(successListener).toHaveBeenCalled();
        });
    });

    describe('ActionEventName.ALL subscription', () => {
        it('should call ALL listener for any event type', () => {
            const allListener = jest.fn();
            const trashEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };
            const createEvent: CreatedNodesEvent = {
                type: ActionEventName.CREATED_NODES,
                nodes: [mockNodeEntity],
            };
            const bookmarkEvent: DeleteBookmarksEvent = {
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: ['bookmark1'],
            };

            const acceptInvitationEvent: AcceptInvitationsEvent = {
                type: ActionEventName.ACCEPT_INVITATIONS,
                items: [
                    {
                        node: mockNodeEntity,
                        sharedInfo: { sharedOn: 1234567890, sharedBy: 'test@example.com' },
                    },
                ],
            };

            const rejectInvitationEvent: RejectInvitationsEvent = {
                type: ActionEventName.REJECT_INVITATIONS,
                uids: ['invitation1'],
            };

            eventBus.subscribe(ActionEventName.ALL, allListener);
            eventBus.emit(trashEvent);
            eventBus.emit(createEvent);
            eventBus.emit(bookmarkEvent);
            eventBus.emit(acceptInvitationEvent);
            eventBus.emit(rejectInvitationEvent);

            expect(allListener).toHaveBeenCalledTimes(5);
            expect(allListener).toHaveBeenCalledWith(trashEvent);
            expect(allListener).toHaveBeenCalledWith(createEvent);
            expect(allListener).toHaveBeenCalledWith(bookmarkEvent);
            expect(allListener).toHaveBeenCalledWith(acceptInvitationEvent);
            expect(allListener).toHaveBeenCalledWith(rejectInvitationEvent);
        });

        it('should call both specific and ALL listeners when event is emitted', () => {
            const specificListener = jest.fn();
            const allListener = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.TRASH_NODES_OPTIMISTIC, specificListener);
            eventBus.subscribe(ActionEventName.ALL, allListener);
            eventBus.emit(testEvent);

            expect(specificListener).toHaveBeenCalledWith(testEvent);
            expect(allListener).toHaveBeenCalledWith(testEvent);
            expect(specificListener).toHaveBeenCalledTimes(1);
            expect(allListener).toHaveBeenCalledTimes(1);
        });

        it('should be able to unsubscribe from ALL events', () => {
            const allListener = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            const unsubscribe = eventBus.subscribe(ActionEventName.ALL, allListener);
            unsubscribe();
            eventBus.emit(testEvent);

            expect(allListener).not.toHaveBeenCalled();
        });

        it('should handle multiple ALL listeners', () => {
            const allListener1 = jest.fn();
            const allListener2 = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            eventBus.subscribe(ActionEventName.ALL, allListener1);
            eventBus.subscribe(ActionEventName.ALL, allListener2);
            eventBus.emit(testEvent);

            expect(allListener1).toHaveBeenCalledWith(testEvent);
            expect(allListener2).toHaveBeenCalledWith(testEvent);
        });

        it('should only remove specific ALL listener when unsubscribed', () => {
            const allListener1 = jest.fn();
            const allListener2 = jest.fn();
            const testEvent: TrashedNodesEvent = {
                type: ActionEventName.TRASH_NODES_OPTIMISTIC,
                uids: ['1'],
            };

            const unsubscribe1 = eventBus.subscribe(ActionEventName.ALL, allListener1);
            eventBus.subscribe(ActionEventName.ALL, allListener2);
            unsubscribe1();
            eventBus.emit(testEvent);

            expect(allListener1).not.toHaveBeenCalled();
            expect(allListener2).toHaveBeenCalledWith(testEvent);
        });
    });
});
