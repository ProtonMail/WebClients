import type { Draft } from 'immer';

import type { MessageState, MessagesState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

import {
    labelConversationsPending,
    labelMessagesPending,
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
    unlabelConversationsPending,
    unlabelMessagesPending,
} from './messagesReducer';

describe('messagesReducer', () => {
    describe('markMessagesAsReadPending', () => {
        it('should mark unread messages as read', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: { ID: 'msg1', Unread: 1 } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            markMessagesAsReadPending(state, {
                type: 'markMessagesAsRead/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [{ ID: 'msg1', Unread: 1 } as MessageMetadata],
                        labelID: 'label1',
                    },
                },
            });

            expect(messageState.data?.Unread).toBe(0);
        });
    });

    describe('markMessagesAsUnreadPending', () => {
        it('should mark read messages as unread', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: { ID: 'msg1', Unread: 0 } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            markMessagesAsUnreadPending(state, {
                type: 'markMessageUnread/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [{ ID: 'msg1', Unread: 0 } as MessageMetadata],
                        labelID: 'label1',
                    },
                },
            });

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
            const conversation = {
                ID: 'conv1',
                Labels: [{ ID: 'label1', ContextNumUnread: 2 }],
            } as Conversation;

            const state = {
                msg1: messageState1,
                msg2: messageState2,
            } as Draft<MessagesState>;

            markConversationsAsReadPending(state, {
                type: 'markConversationsAsRead/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: 'label1',
                    },
                },
            });

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
            const conversation = {
                ID: 'conv1',
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumUnread: 2 },
                    { ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, ContextNumUnread: 2 },
                ],
            } as Conversation;

            const state = {
                msg1: messageState1,
                msg2: messageState2,
            } as Draft<MessagesState>;

            markConversationsAsReadPending(state, {
                type: 'markConversationsAsRead/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: MAILBOX_LABEL_IDS.TRASH,
                    },
                },
            });

            expect(messageState1.data?.Unread).toBe(0);
            expect(messageState2.data?.Unread).toBe(0);
        });
    });

    describe('markConversationsAsUnreadPending', () => {
        it('should mark the last message in read conversation as unread', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    Unread: 0,
                    ConversationID: 'conv1',
                    Order: 1,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                } as Message,
            };
            const messageState2: MessageState = {
                localID: 'msg2',
                data: {
                    ID: 'msg2',
                    Unread: 0,
                    ConversationID: 'conv1',
                    Order: 2,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                } as Message,
            };
            const conversation = {
                ID: 'conv1',
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 }],
            } as Conversation;

            const state = {
                msg1: messageState1,
                msg2: messageState2,
            } as Draft<MessagesState>;

            markConversationsAsUnreadPending(state, {
                type: 'markConversationsAsRead/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                },
            });

            expect(messageState1.data?.Unread).toBe(0); // Should remain read
            expect(messageState2.data?.Unread).toBe(1); // Should be marked as unread (highest Order)
        });

        it('should not update a conversation where the current label already has unread', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    Unread: 1,
                    ConversationID: 'conv1',
                    Order: 1,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                } as Message,
            };
            const messageState2: MessageState = {
                localID: 'msg2',
                data: {
                    ID: 'msg2',
                    Unread: 0,
                    ConversationID: 'conv1',
                    Order: 2,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                } as Message,
            };

            const conversation = {
                ID: 'conv1',
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 }],
            } as Conversation;

            const state = {
                msg1: messageState1,
                msg2: messageState2,
            } as Draft<MessagesState>;

            markConversationsAsUnreadPending(state, {
                type: 'markConversationsAsRead/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                },
            });

            expect(messageState1.data?.Unread).toBe(1);
            // It remains unread because messageState1 is already unread
            expect(messageState2.data?.Unread).toBe(0);
        });

        it('should mark message as unread when conversation label is unread and has a cateory', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    Unread: 0,
                    ConversationID: 'conv1',
                    Order: 1,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                } as Message,
            };

            const conversation = {
                ID: 'conv1',
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, ContextNumUnread: 1 },
                ],
            } as Conversation;

            const state = {
                msg1: messageState1,
            } as Draft<MessagesState>;

            markConversationsAsUnreadPending(state, {
                type: 'markConversationsAsRead/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                    },
                },
            });

            expect(messageState1.data?.Unread).toBe(1);
        });
    });

    describe('labelMessagesPending', () => {
        it('should preserve category label when moving message from INBOX to ARCHIVE', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    LabelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ],
                } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            labelMessagesPending(state, {
                type: 'labelMessages/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [
                            {
                                ID: 'msg1',
                                LabelIDs: [
                                    MAILBOX_LABEL_IDS.INBOX,
                                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                                    MAILBOX_LABEL_IDS.ALL_MAIL,
                                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                                ],
                            } as MessageMetadata,
                        ],
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: [] as Label[],
                        folders: [] as Folder[],
                    },
                },
            });

            expect(messageState.data?.LabelIDs).toStrictEqual([
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.ARCHIVE,
            ]);
            expect(messageState.data?.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.INBOX);
        });

        it('should replace old category with new category when moving between categories', () => {
            const messageState: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    LabelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ],
                } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            labelMessagesPending(state, {
                type: 'labelMessages/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [
                            {
                                ID: 'msg1',
                                LabelIDs: [
                                    MAILBOX_LABEL_IDS.INBOX,
                                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                                    MAILBOX_LABEL_IDS.ALL_MAIL,
                                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                                ],
                            } as MessageMetadata,
                        ],
                        destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        labels: [] as Label[],
                        folders: [] as Folder[],
                    },
                },
            });

            expect(messageState.data?.LabelIDs).toStrictEqual([
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            ]);
            expect(messageState.data?.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
        });
    });

    describe('unlabelMessagesPending', () => {
        it('should not remove CATEGORY_SOCIAL when unlabeling a custom label from a message', () => {
            const customLabelID = 'custom-label-1';
            const messageState: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    LabelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        customLabelID,
                    ],
                } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            unlabelMessagesPending(state, {
                type: 'unlabelMessages/pending',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [
                            {
                                ID: 'msg1',
                                LabelIDs: [
                                    MAILBOX_LABEL_IDS.INBOX,
                                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                                    MAILBOX_LABEL_IDS.ALL_MAIL,
                                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                                    customLabelID,
                                ],
                            } as MessageMetadata,
                        ],
                        destinationLabelID: customLabelID,
                        labels: [{ ID: customLabelID, Name: 'Custom Label', Type: 1 }] as Label[],
                    },
                },
            });

            expect(messageState.data?.LabelIDs).toStrictEqual([
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);
            expect(messageState.data?.LabelIDs).not.toContain(customLabelID);
        });
    });

    describe('unlabelConversationsPending', () => {
        it('should not remove CATEGORY_SOCIAL when unlabeling a custom label from a conversation', () => {
            const customLabelID = 'custom-label-1';
            const messageState: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    ConversationID: 'conv1',
                    LabelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        customLabelID,
                    ],
                } as Message,
            };

            const state = {
                msg1: messageState,
            } as Draft<MessagesState>;

            const conversation = {
                ID: 'conv1',
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: customLabelID, ContextNumMessages: 1, ContextNumUnread: 0 },
                ],
            } as Conversation;

            unlabelConversationsPending(state, {
                type: 'mailbox/unlabelConversations/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        destinationLabelID: customLabelID,
                        labels: [{ ID: customLabelID, Name: 'Custom Label', Type: 1 }] as Label[],
                    },
                },
            });

            expect(messageState.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(messageState.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.INBOX);
            expect(messageState.data?.LabelIDs).not.toContain(customLabelID);
        });
    });

    describe('labelConversationsPending', () => {
        it('should preserve CATEGORY_SOCIAL in message LabelIDs when conversation moves to ARCHIVE', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    ConversationID: 'conv1',
                    LabelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ],
                } as Message,
            };

            const state = {
                msg1: messageState1,
            } as Draft<MessagesState>;

            const conversation = {
                ID: 'conv1',
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, ContextNumMessages: 1, ContextNumUnread: 0 },
                ],
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversations/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: [] as Label[],
                        folders: [] as Folder[],
                    },
                },
            });

            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.ARCHIVE);
            expect(messageState1.data?.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.INBOX);
        });

        it('should replace old category with new category and keep everything else unchanged', () => {
            const messageState1: MessageState = {
                localID: 'msg1',
                data: {
                    ID: 'msg1',
                    ConversationID: 'conv1',
                    LabelIDs: [
                        MAILBOX_LABEL_IDS.INBOX,
                        MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        MAILBOX_LABEL_IDS.ALL_MAIL,
                        MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        MAILBOX_LABEL_IDS.STARRED,
                    ],
                } as Message,
            };

            const state = {
                msg1: messageState1,
            } as Draft<MessagesState>;

            const conversation = {
                ID: 'conv1',
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 1, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, ContextNumMessages: 1, ContextNumUnread: 0 },
                ],
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversations/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        labels: [] as Label[],
                        folders: [] as Folder[],
                    },
                },
            });

            // Old category removed, new category added
            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            expect(messageState1.data?.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            // Everything else unchanged
            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.INBOX);
            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(messageState1.data?.LabelIDs).toContain(MAILBOX_LABEL_IDS.STARRED);
        });
    });
});
