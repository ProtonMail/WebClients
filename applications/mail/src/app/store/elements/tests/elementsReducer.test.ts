import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';
import {
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
} from 'proton-mail/store/elements/elementsReducers';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CONVERSATION_ID,
    MESSAGE_ID,
    expectConversationLabelsSameArray,
    setupConversation,
    setupMessage,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

describe('markMessageAs', () => {
    let testState: Draft<ElementsState>;

    beforeEach(() => {
        testState = {
            elements: {},
            total: {},
            params: {
                filter: {},
                conversationMode: true,
            },
        } as unknown as Draft<ElementsState>;
    });

    describe('markAsRead', () => {
        it('should mark element message and conversation as read when marking message', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                attachments: [{ Name: 'att' }] as Attachment[],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 1,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            markMessagesAsReadPending(testState, {
                type: 'mailbox/markMessageAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        conversations: [conversation],
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(0);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should mark element message and conversation as read when marking conversation', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                attachments: [{ Name: 'att' }] as Attachment[],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 1,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            markConversationsAsReadPending(testState, {
                type: 'mailbox/markConversationsAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(0);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should mark category as read when marking the conversation as read', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 1,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            markConversationsAsReadPending(testState, {
                type: 'mailbox/markConversationsAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [message, conversation],
                        labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(0);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                },
            ]);
        });
    });

    describe('markAsUnRead', () => {
        it('should mark element message and conversation as unread when marking message', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                attachments: [{ Name: 'att' }] as Attachment[],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 0,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            markMessagesAsUnreadPending(testState, {
                type: 'mailbox/markMessageAsUnRead',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        conversations: [conversation],
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(1);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should mark element conversation only as unread when marking conversation', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                attachments: [{ Name: 'att' }] as Attachment[],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 0,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            markConversationsAsUnreadPending(testState, {
                type: 'mailbox/markConversationsAsUnRead',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [message, conversation],
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(1);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should update inbox when marking category conversation as read', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'read',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 0,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            markConversationsAsUnreadPending(testState, {
                type: 'mailbox/markConversationsAsUnRead',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [message, conversation],
                        labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(0);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(1);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                },
            ]);
        });
    });
});
