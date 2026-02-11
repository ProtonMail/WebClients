import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { MessageState, MessagesState } from '@proton/mail/store/messages/messagesTypes';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';

import {
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
} from './messagesReducer';

jest.mock('../messagesSelectors', () => ({
    messageByID: jest.fn(),
    messagesByConversationID: jest.fn(),
}));

const { messageByID, messagesByConversationID } = require('../messagesSelectors');

describe('messagesReducer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('markMessagesAsReadPending', () => {
        it('should mark unread messages as read', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: { ID: 'msg1', Unread: 1 } as Message,
            };
            const state = {} as Draft<MessagesState>;
            const action = {
                meta: {
                    arg: {
                        elements: [{ ID: 'msg1', Unread: 1 } as MessageMetadata],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { elements: MessageMetadata[]; labelID: string } }>;

            messageByID.mockReturnValue(messageState);

            markMessagesAsReadPending(state, action);

            expect(messageState.data?.Unread).toBe(0);
        });
    });

    describe('markMessagesAsUnreadPending', () => {
        it('should mark read messages as unread', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: { ID: 'msg1', Unread: 0 } as Message,
            };
            const state = {} as Draft<MessagesState>;
            const action = {
                meta: {
                    arg: {
                        elements: [{ ID: 'msg1', Unread: 0 } as MessageMetadata],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { elements: MessageMetadata[]; labelID: string } }>;

            messageByID.mockReturnValue(messageState);

            markMessagesAsUnreadPending(state, action);

            expect(messageState.data?.Unread).toBe(1);
        });
    });

    describe('markConversationsAsReadPending', () => {
        it('should mark all messages in unread conversation as read', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: { ID: 'msg1', Unread: 1, ConversationID: 'conv1' } as Message,
            };
            const messageState2: MessageState = {
                localID: 'msg2',
                data: { ID: 'msg2', Unread: 1, ConversationID: 'conv1' } as Message,
            };
            const state = {} as Draft<MessagesState>;
            const conversation = {
                ID: 'conv1',
                Labels: [{ ID: 'label1', ContextNumUnread: 2 }],
            } as Conversation;
            const action = {
                meta: {
                    arg: {
                        elements: [conversation],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { elements: Element[]; labelID: string } }>;

            messagesByConversationID.mockReturnValue([messageState1, messageState2]);

            markConversationsAsReadPending(state, action);

            expect(messageState1.data?.Unread).toBe(0);
            expect(messageState2.data?.Unread).toBe(0);
        });
    });

    describe('markConversationsAsUnreadPending', () => {
        it('should mark the last message in read conversation as unread', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: { ID: 'msg1', Unread: 0, ConversationID: 'conv1', Order: 1, LabelIDs: ['label1'] } as Message,
            };
            const messageState2: MessageState = {
                localID: 'msg2',
                data: { ID: 'msg2', Unread: 0, ConversationID: 'conv1', Order: 2, LabelIDs: ['label1'] } as Message,
            };
            const state = {} as Draft<MessagesState>;
            const conversation = {
                ID: 'conv1',
                Labels: [{ ID: 'label1', ContextNumUnread: 0 }],
            } as Conversation;
            const action = {
                meta: {
                    arg: {
                        elements: [conversation],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { elements: Element[]; labelID: string } }>;

            messagesByConversationID.mockReturnValue([messageState1, messageState2]);

            markConversationsAsUnreadPending(state, action);

            expect(messageState1.data?.Unread).toBe(0); // Should remain read
            expect(messageState2.data?.Unread).toBe(1); // Should be marked as unread (highest Order)
        });
    });
});
