import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import {
    markConversationsAsRead,
    markConversationsAsUnread,
    markMessagesAsRead,
    markMessagesAsUnread,
} from '../../conversationCountsReducers';

const getInitialState = (value: Draft<ModelState<LabelCount[]>>['value']) => {
    return {
        value,
        error: null,
        meta: {
            fetchedAt: 0,
            fetchedEphemeral: false,
        },
    };
};

describe('conversationCountsReducers', () => {
    const labelID1 = 'label1';
    const labelID2 = 'label2';
    const conversationID1 = 'conversation1';
    const conversationID2 = 'conversation2';
    const messageID1 = 'message1';
    const messageID2 = 'message2';
    let state: Draft<ModelState<LabelCount[]>>;

    describe('markConversationsAsReadPending', () => {
        beforeEach(() => {
            state = getInitialState([
                {
                    LabelID: labelID1,
                    Unread: 2,
                    Total: 2,
                },
                {
                    LabelID: labelID2,
                    Unread: 1,
                    Total: 1,
                },
            ]);
        });

        it('should mark the conversation as read in all locations associated with the conversation', () => {
            const conversation1 = {
                ID: conversationID1,
                ContextNumUnread: 1,
                Labels: [{ ID: labelID1, ContextNumUnread: 1 }],
            };

            const conversation2 = {
                ID: conversationID2,
                ContextNumUnread: 1,
                Labels: [
                    { ID: labelID1, ContextNumUnread: 1 },
                    { ID: labelID2, ContextNumUnread: 1 },
                ],
            };

            markConversationsAsRead(state, {
                type: 'mailbox/markConversationsAsRead',
                payload: { conversations: [conversation1, conversation2], labelID: labelID1 },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 0, Total: 2 },
                { LabelID: labelID2, Unread: 0, Total: 1 },
            ]);
        });

        it('should skip update if conversation is already read', () => {
            const conversation1 = {
                ID: conversationID1,
                ContextNumUnread: 0,
                Labels: [{ ID: labelID1, ContextNumUnread: 0 }],
            };

            markConversationsAsRead(state, {
                type: 'mailbox/markConversationsAsRead',
                payload: { conversations: [conversation1], labelID: labelID1 },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 2, Total: 2 },
                { LabelID: labelID2, Unread: 1, Total: 1 },
            ]);
        });
    });

    describe('markConversationsAsUnreadPending', () => {
        beforeEach(() => {
            state = getInitialState([
                { LabelID: labelID1, Unread: 0, Total: 2 },
                { LabelID: labelID2, Unread: 0, Total: 1 },
            ]);
        });

        it('should mark the conversation as unread only in the current location', () => {
            const conversation1 = {
                ID: conversationID1,
                ContextNumUnread: 0,
                Labels: [{ ID: labelID1, ContextNumUnread: 0 }],
            };

            const conversation2 = {
                ID: conversationID2,
                ContextNumUnread: 0,
                Labels: [
                    { ID: labelID1, ContextNumUnread: 0 },
                    { ID: labelID2, ContextNumUnread: 0 },
                ],
            };

            markConversationsAsUnread(state, {
                type: 'mailbox/markConversationsAsUnread',
                payload: { conversations: [conversation1, conversation2], labelID: labelID1 },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 2, Total: 2 },
                { LabelID: labelID2, Unread: 0, Total: 1 },
            ]);
        });
    });

    describe('markMessagesAsUnread', () => {
        beforeEach(() => {
            state = getInitialState([
                { LabelID: labelID1, Unread: 0, Total: 5 },
                { LabelID: labelID2, Unread: 0, Total: 3 },
            ]);
        });

        it('should increment unread count when conversation becomes unread', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: labelID1, ContextNumUnread: 0 }],
            };

            const conversation2 = {
                ID: conversationID2,
                Labels: [
                    { ID: labelID1, ContextNumUnread: 0 },
                    { ID: labelID2, ContextNumUnread: 0 },
                ],
            };

            const message1 = {
                ID: messageID1,
                ConversationID: conversationID1,
                LabelIDs: [labelID1],
                Unread: 0,
            } as MessageMetadata;

            const message2 = {
                ID: messageID2,
                ConversationID: conversationID2,
                LabelIDs: [labelID1, labelID2],
                Unread: 0,
            } as MessageMetadata;

            state.value = [
                { LabelID: labelID1, Unread: 0, Total: 5 },
                { LabelID: labelID2, Unread: 0, Total: 3 },
            ];

            markMessagesAsUnread(state, {
                type: 'mailbox/markMessagesAsUnread',
                payload: {
                    messages: [message1, message2],
                    labelID: labelID1,
                    conversations: [conversation1, conversation2],
                },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 2, Total: 5 },
                { LabelID: labelID2, Unread: 0, Total: 3 }, // Unread state is not updated because we don't know if the conversation is unread in other labels
            ]);
        });

        it('should not increment unread count when conversation is already unread', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: labelID1, ContextNumUnread: 1 }],
            };

            const message1 = {
                ID: messageID1,
                ConversationID: conversationID1,
                LabelIDs: [labelID1],
                Unread: 0,
            } as MessageMetadata;

            markMessagesAsUnread(state, {
                type: 'mailbox/markMessagesAsUnread',
                payload: {
                    messages: [message1],
                    labelID: labelID1,
                    conversations: [conversation1],
                },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 0, Total: 5 },
                { LabelID: labelID2, Unread: 0, Total: 3 },
            ]);
        });
    });

    describe('markMessagesAsRead', () => {
        beforeEach(() => {
            state = getInitialState([
                { LabelID: labelID1, Unread: 2, Total: 5 },
                { LabelID: labelID2, Unread: 1, Total: 3 },
            ]);
        });

        it('should decrement unread count when all messages in conversation are read', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: labelID1, ContextNumUnread: 2 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [labelID1], Unread: 1 },
                { ConversationID: conversationID1, ID: 'msg2', LabelIDs: [labelID1], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: labelID1,
                    conversations: [conversation1],
                },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 1, Total: 5 },
                { LabelID: labelID2, Unread: 1, Total: 3 },
            ]);
        });

        it('should not decrement when not all messages in conversation are read', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: labelID1, ContextNumUnread: 2 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [labelID1], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: labelID1,
                    conversations: [conversation1],
                },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 2, Total: 5 },
                { LabelID: labelID2, Unread: 1, Total: 3 },
            ]);
        });

        it('should handle multiple conversations with different message counts', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: labelID1, ContextNumUnread: 1 }],
            };

            const conversation2 = {
                ID: conversationID2,
                Labels: [{ ID: labelID1, ContextNumUnread: 2 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [labelID1], Unread: 1 },
                { ConversationID: conversationID2, ID: 'msg2', LabelIDs: [labelID1], Unread: 1 },
                { ConversationID: conversationID2, ID: 'msg3', LabelIDs: [labelID1], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: labelID1,
                    conversations: [conversation1, conversation2],
                },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 0, Total: 5 },
                { LabelID: labelID2, Unread: 1, Total: 3 },
            ]);
        });

        it('should handle messages from different conversations', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: labelID1, ContextNumUnread: 1 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [labelID1], Unread: 1 },
                { ConversationID: 'other-conversation', ID: 'msg2', LabelIDs: [labelID1], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: labelID1,
                    conversations: [conversation1],
                },
            });

            expect(state.value).toEqual([
                { LabelID: labelID1, Unread: 1, Total: 5 },
                { LabelID: labelID2, Unread: 1, Total: 3 },
            ]);
        });
    });
});
