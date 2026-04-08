import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { MessageState, MessagesState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

import {
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
} from './messagesReducer';

describe('messagesReducer', () => {
    afterEach(() => {
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
                        messages: [{ ID: 'msg1', Unread: 1 } as MessageMetadata],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { messages: MessageMetadata[]; labelID: string } }>;

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
                        messages: [{ ID: 'msg1', Unread: 0 } as MessageMetadata],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { messages: MessageMetadata[]; labelID: string } }>;

            messageByID.mockReturnValue(messageState);

            markMessagesAsUnreadPending(state, action);

            expect(messageState.data?.Unread).toBe(1);
        });

        it('should mark read messages from category as unread when in Inbox', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    Unread: 0,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            // messageByID.mockReturnValue(messageState);
            markMessagesAsUnreadPending(state, {
                type: 'markMessageUnread/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [
                            {
                                ID: 'msg1',
                                Unread: 0,
                                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                            } as MessageMetadata,
                        ],
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                },
            });

            expect(messageState.data?.Unread).toBe(1);
        });

        it('should mark read messages from category as unread when in Trash and not in Inbox', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    Unread: 0,
                    LabelIDs: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            markMessagesAsUnreadPending(state, {
                type: 'markMessageUnread/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [
                            {
                                ID: 'msg1',
                                Unread: 0,
                                LabelIDs: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                            } as MessageMetadata,
                        ],
                        labelID: MAILBOX_LABEL_IDS.TRASH,
                    },
                },
            });

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
                        conversations: [conversation],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { conversations: Conversation[]; labelID: string } }>;

            messagesByConversationID.mockReturnValue([messageState1, messageState2]);

            markConversationsAsReadPending(state, action);

            expect(messageState1.data?.Unread).toBe(0);
            expect(messageState2.data?.Unread).toBe(0);
        });

        it('should mark all messages as read regardless of which label the conversation is marked as read from', () => {
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
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumUnread: 2 },
                    { ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, ContextNumUnread: 2 },
                ],
            } as Conversation;
            const action = {
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: MAILBOX_LABEL_IDS.TRASH,
                    },
                },
            } as PayloadAction<undefined, string, { arg: { conversations: Conversation[]; labelID: string } }>;

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
                        conversations: [conversation],
                        labelID: 'label1',
                    },
                },
            } as PayloadAction<undefined, string, { arg: { conversations: Conversation[]; labelID: string } }>;

            messagesByConversationID.mockReturnValue([messageState1, messageState2]);

            markConversationsAsUnreadPending(state, action);

            expect(messageState1.data?.Unread).toBe(0); // Should remain read
            expect(messageState2.data?.Unread).toBe(1); // Should be marked as unread (highest Order)
        });
    });
});
