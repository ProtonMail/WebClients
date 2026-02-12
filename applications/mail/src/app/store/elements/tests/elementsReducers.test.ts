import type { Draft } from '@reduxjs/toolkit';

import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

import {
    markConversationsAsReadPending,
    markMessagesAsReadPending,
    markNewsletterElementsAsReadPending,
} from '../elementsReducers';
import type { ElementsState } from '../elementsTypes';

describe('elementsReducers', () => {
    const labelID = '1';
    const messageID1 = 'Message-1';
    const messageID2 = 'Message-2';
    const conversationID = 'Conversation-1';
    const newsletterSubscriptionID1 = '1';
    const newsletterSubscriptionID2 = '2';
    let state: Draft<ElementsState>;
    let message1: Message;
    let message2: Message;
    let conversation1: Conversation;

    beforeEach(() => {
        message1 = {
            ID: messageID1,
            Unread: 0,
            LabelIDs: [labelID],
            ConversationID: conversationID,
            NewsletterSubscriptionID: newsletterSubscriptionID1,
        } as Message;
        message2 = {
            ID: messageID2,
            Unread: 1,
            LabelIDs: [labelID],
            ConversationID: conversationID,
            NewsletterSubscriptionID: newsletterSubscriptionID2,
        } as Message;
        conversation1 = {
            ID: conversationID,
            ContextNumUnread: 1,
            NumUnread: 1,
            Labels: [{ ID: labelID, ContextNumUnread: 1 }],
        } as Conversation;
        state = {
            elements: {
                [messageID1]: message1,
                [messageID2]: message2,
                [conversationID]: conversation1,
            },
            total: {},
            params: {
                filter: {},
                conversationMode: true,
            },
        } as unknown as Draft<ElementsState>;
    });

    describe('markMessagesAsReadPending', () => {
        it('should mark messages as read and update conversation', () => {
            markMessagesAsReadPending(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message1, message2],
                        conversations: [conversation1],
                        labelID,
                    },
                },
            });

            expect(state.elements).toEqual({
                [messageID1]: { ...message1, Unread: 0 },
                [messageID2]: { ...message2, Unread: 0 },
                [conversationID]: {
                    ...conversation1,
                    ContextNumUnread: 0,
                    NumUnread: 0,
                    Labels: [{ ...conversation1?.Labels?.[0], ContextNumUnread: 0 }],
                },
            });
        });
    });

    describe('markConversationsAsReadPending', () => {
        it('should mark conversations as read and update all messages attached to the conversations', () => {
            markConversationsAsReadPending(state, {
                type: 'mailbox/markConversationsAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation1],
                        labelID,
                    },
                },
            });

            expect(state.elements).toEqual({
                [messageID1]: { ...message1, Unread: 0 },
                [messageID2]: { ...message2, Unread: 0 },
                [conversationID]: {
                    ...conversation1,
                    ContextNumUnread: 0,
                    NumUnread: 0,
                    Labels: [{ ...conversation1?.Labels?.[0], ContextNumUnread: 0 }],
                },
            });
        });
    });

    describe('markNewsletterElementsAsReadPending', () => {
        it('should not mark message as unread if already read', () => {
            markNewsletterElementsAsReadPending(state, {
                type: 'mailbox/markNewsletterElementsAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        data: {
                            MarkAsRead: true,
                            ApplyTo: 'Existing',
                        },
                        subscription: {
                            ID: newsletterSubscriptionID1,
                        } as NewsletterSubscription,
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'pending',
                },
            });

            expect(state.elements).toEqual({
                [messageID1]: { ...message1, Unread: 0 },
                [messageID2]: { ...message2, Unread: 1 },
                [conversationID]: conversation1,
            });
        });

        it('should mark message as unread if not already read', () => {
            markNewsletterElementsAsReadPending(state, {
                type: 'mailbox/markNewsletterElementsAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        data: {
                            MarkAsRead: true,
                            ApplyTo: 'Existing',
                        },
                        subscription: {
                            ID: newsletterSubscriptionID2,
                        } as NewsletterSubscription,
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'pending',
                },
            });

            expect(state.elements).toEqual({
                [messageID1]: { ...message1, Unread: 0 },
                [messageID2]: { ...message2, Unread: 0 },
                [conversationID]: conversation1,
            });
        });

        it('should not mark elements as read if the action is not "mark as read"', () => {
            markNewsletterElementsAsReadPending(state, {
                type: 'mailbox/markNewsletterElementsAsRead',
                payload: undefined,
                meta: {
                    arg: {
                        data: {
                            MarkAsRead: false,
                            ApplyTo: 'Existing',
                        },
                        subscription: {
                            ID: newsletterSubscriptionID2,
                        } as NewsletterSubscription,
                    },
                    requestId: 'test-request-id',
                    requestStatus: 'pending',
                },
            });

            expect(state.elements).toEqual({
                [messageID1]: message1,
                [messageID2]: message2,
                [conversationID]: conversation1,
            });
        });
    });
});
