import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';

import type { Element } from '../../models/element';
import type { ConversationEvent, MessageEvent } from '../../models/event';
import { processElementEvents } from './useElementsEvents';

const mockElement = (id: string): Element => ({
    ID: id,
    Time: Date.now(),
    Order: 1,
});

const mockConversationEvent = (id: string, action: number, conversation?: Conversation): ConversationEvent => ({
    ID: id,
    Action: action,
    ...(conversation && { Conversation: conversation }),
});

const mockMessageEvent = (id: string, action: number, message?: Message): MessageEvent => ({
    ID: id,
    Action: action,
    ...(message && { Message: message }),
});

const mockElementsState = (elementIds: string[] = []): ElementsState => ({
    elements: elementIds.reduce((acc, id) => ({ ...acc, [id]: mockElement(id) }), {}),
    bypassFilter: [],
    invalidated: false,
    beforeFirstLoad: false,
    pendingActions: 0,
    params: {
        labelID: 'inbox',
        conversationMode: true,
        sort: { sort: 'Time', desc: true },
        filter: {},
        search: {},
        esEnabled: false,
        isSearching: false,
    },
    pendingRequest: false,
    taskRunning: { labelIDs: [], timeoutID: undefined },
    total: {},
    page: 0,
    pages: {},
    retry: {
        payload: undefined,
        count: 0,
        error: undefined,
    },
});

describe('processElementEvents', () => {
    describe('conversation events', () => {
        it('should handle CREATE action for conversations', () => {
            const conversation = mockElement('conv-1');
            const conversationEvents = [mockConversationEvent('conv-1', EVENT_ACTIONS.CREATE, conversation)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents: [],
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([conversation]);
            expect(result.toUpdate).toEqual([]);
            expect(result.toLoad).toEqual([]);
            expect(result.toDelete).toEqual([]);
        });

        it('should handle CREATE action for conversations when task is running', () => {
            const conversation = mockElement('conv-1');
            const conversationEvents = [mockConversationEvent('conv-1', EVENT_ACTIONS.CREATE, conversation)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents: [],
                elementsState,
                isTaskRunning: true,
            });

            expect(result.toCreate).toEqual([conversation]);
            expect(result.toLoad).toEqual([conversation]);
        });

        it('should handle UPDATE action for existing conversations', () => {
            const conversation = mockElement('conv-1');
            const conversationEvents = [mockConversationEvent('conv-1', EVENT_ACTIONS.UPDATE, conversation)];
            const elementsState = mockElementsState(['conv-1']);

            const result = processElementEvents({
                conversationEvents,
                messageEvents: [],
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toUpdate).toEqual([conversation]);
            expect(result.toCreate).toEqual([]);
        });

        it('should handle UPDATE action for non-existing conversations by creating them', () => {
            const conversation = mockElement('conv-1');
            const conversationEvents = [mockConversationEvent('conv-1', EVENT_ACTIONS.UPDATE, conversation)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents: [],
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([conversation]);
            expect(result.toUpdate).toEqual([]);
        });

        it('should handle DELETE action for conversations', () => {
            const conversationEvents = [mockConversationEvent('conv-1', EVENT_ACTIONS.DELETE)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents: [],
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toDelete).toEqual(['conv-1']);
        });
    });

    describe('message events', () => {
        it('should handle CREATE action for messages', () => {
            const message = mockElement('msg-1') as Message;
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.CREATE, message)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents,
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([message]);
            expect(result.toUpdate).toEqual([]);
            expect(result.toLoad).toEqual([]);
            expect(result.toDelete).toEqual([]);
        });

        it('should handle CREATE action for messages when task is running', () => {
            const message = mockElement('msg-1') as Message;
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.CREATE, message)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents,
                elementsState,
                isTaskRunning: true,
            });

            expect(result.toCreate).toEqual([message]);
            expect(result.toLoad).toEqual([message]);
        });

        it('should handle UPDATE_DRAFT action for messages', () => {
            const message = mockElement('msg-1') as Message;
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.UPDATE_DRAFT, message)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents,
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toLoad).toEqual([message]);
        });

        it('should handle UPDATE_FLAGS action for existing messages', () => {
            const message = mockElement('msg-1') as Message;
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.UPDATE_FLAGS, message)];
            const elementsState = mockElementsState(['msg-1']);

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents,
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toUpdate).toEqual([message]);
            expect(result.toCreate).toEqual([]);
        });

        it('should handle UPDATE_FLAGS action for non-existing messages by creating them', () => {
            const message = mockElement('msg-1') as Message;
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.UPDATE_FLAGS, message)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents,
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([message]);
            expect(result.toUpdate).toEqual([]);
        });

        it('should handle DELETE action for messages', () => {
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.DELETE)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents,
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toDelete).toEqual(['msg-1']);
        });
    });

    describe('mixed events', () => {
        it('should handle multiple conversation and message events', () => {
            const conversation = mockElement('conv-1');
            const message = mockElement('msg-1') as Message;

            const conversationEvents = [
                mockConversationEvent('conv-1', EVENT_ACTIONS.CREATE, conversation),
                mockConversationEvent('conv-2', EVENT_ACTIONS.DELETE),
            ];

            const messageEvents = [
                mockMessageEvent('msg-1', EVENT_ACTIONS.CREATE, message),
                mockMessageEvent('msg-2', EVENT_ACTIONS.UPDATE_DRAFT, mockElement('msg-2') as Message),
                mockMessageEvent('msg-3', EVENT_ACTIONS.DELETE),
            ];

            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents,
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([conversation, message]);
            expect(result.toLoad).toEqual([mockElement('msg-2')]);
            expect(result.toDelete).toEqual(['conv-2', 'msg-3']);
        });

        it('should handle task running scenario with mixed events', () => {
            const conversation = mockElement('conv-1');
            const message = mockElement('msg-1') as Message;

            const conversationEvents = [mockConversationEvent('conv-1', EVENT_ACTIONS.CREATE, conversation)];
            const messageEvents = [mockMessageEvent('msg-1', EVENT_ACTIONS.CREATE, message)];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents,
                elementsState,
                isTaskRunning: true,
            });

            expect(result.toCreate).toEqual([conversation, message]);
            expect(result.toLoad).toEqual([conversation, message]);
        });
    });

    describe('edge cases', () => {
        it('should handle empty events', () => {
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents: [],
                messageEvents: [],
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([]);
            expect(result.toUpdate).toEqual([]);
            expect(result.toLoad).toEqual([]);
            expect(result.toDelete).toEqual([]);
        });

        it('should handle unknown action types gracefully', () => {
            const unknownAction = 999;
            const conversationEvents = [mockConversationEvent('conv-1', unknownAction, mockElement('conv-1'))];
            const elementsState = mockElementsState();

            const result = processElementEvents({
                conversationEvents,
                messageEvents: [],
                elementsState,
                isTaskRunning: false,
            });

            expect(result.toCreate).toEqual([]);
            expect(result.toUpdate).toEqual([]);
            expect(result.toLoad).toEqual([]);
            expect(result.toDelete).toEqual([]);
        });
    });
});
