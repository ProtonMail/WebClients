import type { Draft } from 'immer';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from '../../models/conversation';
import {
    labelConversationsPending,
    labelMessagesPending,
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
    unlabelConversationsPending,
    unlabelMessagesPending,
} from './conversationsReducers';
import type { ConversationState, ConversationsState } from './conversationsTypes';

describe('conversationsReducers', () => {
    const conversationID = 'conversation-1';
    const messageID1 = 'message-1';
    const messageID2 = 'message-2';
    const messageID3 = 'message-3';

    let state: Draft<ConversationsState>;
    let mockMessage1: Message;
    let mockMessage2: Message;
    let mockMessage3: Message;
    let mockConversation: Conversation;
    let mockConversationState: ConversationState;

    beforeEach(() => {
        mockMessage1 = {
            ID: messageID1,
            ConversationID: conversationID,
            Unread: 1,
            Order: 1,
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
            Flags: 1, // FLAG_RECEIVED
        } as Message;

        mockMessage2 = {
            ID: messageID2,
            ConversationID: conversationID,
            Unread: 1,
            Order: 2,
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            Flags: 1, // FLAG_RECEIVED
        } as Message;

        mockMessage3 = {
            ID: messageID3,
            ConversationID: conversationID,
            Unread: 0,
            Order: 3,
            LabelIDs: [MAILBOX_LABEL_IDS.DRAFTS],
            Flags: 1, // FLAG_RECEIVED
        } as Message;

        mockConversation = {
            ID: conversationID,
            Subject: 'Test Conversation',
            ContextNumUnread: 2,
            NumUnread: 2,
            Labels: [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumUnread: 2,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumUnread: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.DRAFTS,
                    ContextNumUnread: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    ContextNumUnread: 2,
                },
            ],
        } as Conversation;

        mockConversationState = {
            Conversation: mockConversation,
            Messages: [mockMessage1, mockMessage2, mockMessage3],
            loadRetry: 0,
            errors: { network: [], unknown: [] },
        };

        state = {
            [conversationID]: mockConversationState,
        } as Draft<ConversationsState>;
    });

    describe('Mark messages as read', () => {
        describe('markMessagesAsReadPending', () => {
            it('should mark unread messages as read and update conversation unread counts', () => {
                const messages = [mockMessage1, mockMessage2];

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
                const label = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(label?.ContextNumUnread).toBe(0);
            });

            it('should skip already read messages', () => {
                const readMessage = { ...mockMessage1, Unread: 0 };
                const messages = [readMessage];

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                // Should remain unchanged since message was already read
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(2);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(2);
            });

            it('should handle partial read operations', () => {
                const messages = [mockMessage1]; // Only one message

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                const label = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(label?.ContextNumUnread).toBe(1);
            });

            it('should handle category label update when marking messages as read', () => {
                const messages = [mockMessage1];

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                const inboxLabel = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                const categoryLabel = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS
                );
                expect(inboxLabel?.ContextNumUnread).toBe(1);
                expect(categoryLabel?.ContextNumUnread).toBe(1);
            });
        });
    });

    describe('Mark messages as unread', () => {
        describe('markMessagesAsUnreadPending', () => {
            beforeEach(() => {
                // Start with read messages
                mockMessage1.Unread = 0;
                mockMessage2.Unread = 0;
                mockConversation.ContextNumUnread = 0;
                mockConversation.NumUnread = 0;
                if (mockConversation.Labels) {
                    mockConversation.Labels[0].ContextNumUnread = 0;
                }
            });

            it('should mark read messages as unread and update conversation unread counts', () => {
                const messages = [mockMessage1, mockMessage2];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(2);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(2);
                const label = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(label?.ContextNumUnread).toBe(2);
            });

            it('should skip already unread messages', () => {
                const unreadMessage = { ...mockMessage1, Unread: 1 };
                const messages = [unreadMessage];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                // Should remain unchanged since message was already unread
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
            });

            it('should only update labels that contain the message', () => {
                const messageWithDifferentLabel = {
                    ...mockMessage1,
                    LabelIDs: ['different-label'],
                    Flags: 1, // FLAG_RECEIVED
                };
                const messages: MessageMetadata[] = [messageWithDifferentLabel];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                // Label should not be updated since message doesn't have this label
                const label = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(label?.ContextNumUnread).toBe(0);
            });

            it('should update category label when marking as unread from Inbox', () => {
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumUnread: 2,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumUnread: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                        ContextNumUnread: 2,
                    },
                ];

                const messages = [mockMessage1, mockMessage2];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(
                    updatedConversationState?.Conversation.Labels?.every(
                        ({ ContextNumUnread }) => ContextNumUnread !== 0
                    )
                ).toEqual(true);
            });

            it('should update category label when marking as unread from Trash', () => {
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumUnread: 2,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumUnread: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                        ContextNumUnread: 2,
                    },
                ];

                const messages = [mockMessage1, mockMessage2];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.TRASH,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(
                    updatedConversationState?.Conversation.Labels?.every(
                        ({ ContextNumUnread }) => ContextNumUnread !== 0
                    )
                ).toEqual(true);
            });
        });
    });

    describe('Mark conversations as read', () => {
        describe('markConversationsAsReadPending', () => {
            it('should mark unread conversation as read', () => {
                const conversations = [mockConversation];

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
                expect(
                    updatedConversationState!.Conversation.Labels!.every((label) => label.ContextNumUnread === 0)
                ).toBe(true);
            });

            it('should skip already read conversations', () => {
                const readConversation = {
                    ...mockConversation,
                    Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 }],
                };
                const conversations = [readConversation];

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                // Should remain unchanged since conversation was already read
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(2);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(2);
            });

            it('should mark all messages associated with the conversation as read', () => {
                const conversations = [mockConversation];

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
                expect(updatedConversationState!.Messages!.every((message) => message.Unread === 0)).toBe(true);
            });

            it('should decrement category label unread count regardless of the label the conversation is marked as read from', () => {
                const trashConversation = {
                    ...mockConversation,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumUnread: 2 },
                        { ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, ContextNumUnread: 2 },
                    ],
                };
                state[conversationID] = { ...mockConversationState, Conversation: trashConversation };

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations: [trashConversation],
                            labelID: MAILBOX_LABEL_IDS.TRASH,
                        },
                    },
                });

                const labels = state[conversationID]!.Conversation.Labels!;
                expect(labels.find((label) => label.ID === MAILBOX_LABEL_IDS.TRASH)?.ContextNumUnread).toBe(0);
                expect(
                    labels.find((label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS)?.ContextNumUnread
                ).toBe(0);
            });
        });
    });

    describe('Mark conversations as unread', () => {
        describe('markConversationsAsUnreadPending', () => {
            beforeEach(() => {
                // Start with read conversation
                mockConversation.ContextNumUnread = 0;
                mockConversation.NumUnread = 0;
                if (mockConversation.Labels) {
                    mockConversation.Labels[0].ContextNumUnread = 0;
                }
            });

            it('should mark read conversation as unread', () => {
                const conversations = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                const label = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(label?.ContextNumUnread).toBe(1);
            });

            it('should skip already unread conversations', () => {
                const unreadConversation = {
                    ...mockConversation,
                    Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 }],
                };
                const conversations = [unreadConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                // Should remain unchanged since conversation was already unread
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
            });

            it('should only update the specific label', () => {
                const conversations = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                const label = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(label?.ContextNumUnread).toBe(1);
            });

            it('should mark the last non draft message of the current location as unread', () => {
                const conversations = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Messages![0].Unread).toBe(1);
            });

            it('should not mark draft message as unread', () => {
                const draftMessage = {
                    ...mockMessage1,
                    ID: 'draft-message',
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.DRAFTS],
                    Flags: 0, // Draft: no sent/received flags
                    Unread: 0,
                };

                // Create a fresh conversation state with only the draft message
                const conversationWithOnlyDrafts: ConversationState = {
                    Conversation: {
                        ...mockConversation,
                        ContextNumUnread: 0,
                        NumUnread: 0,
                        Labels: [
                            {
                                ID: MAILBOX_LABEL_IDS.INBOX,
                                ContextNumUnread: 0,
                            },
                        ],
                    },
                    Messages: [draftMessage],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };
                state[conversationID] = conversationWithOnlyDrafts;

                const conversations = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                // Draft message should not be marked as unread
                expect(updatedConversationState!.Messages![0].Unread).toBe(0);
            });

            it('should mark the latest non-draft message when multiple messages exist', () => {
                const olderMessage = {
                    ...mockMessage1,
                    ID: 'older-message',
                    Order: 1,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                    Unread: 0,
                    Flags: 1, // FLAG_RECEIVED
                };
                const newerMessage = {
                    ...mockMessage2,
                    ID: 'newer-message',
                    Order: 3,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                    Unread: 0,
                    Flags: 1, // FLAG_RECEIVED
                };
                const draftMessage = {
                    ...mockMessage3,
                    ID: 'draft-message',
                    Order: 4,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.DRAFTS],
                    Flags: 0, // Draft: no sent/received flags
                    Unread: 0,
                };

                const conversationWithMultipleMessages = {
                    ...mockConversationState,
                    Messages: [olderMessage, newerMessage, draftMessage],
                };
                state[conversationID] = conversationWithMultipleMessages;

                const conversations = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // Should mark the newer non-draft message as unread (highest order)
                const updatedOlderMessage = updatedConversationState!.Messages!.find((m) => m.ID === 'older-message');
                const updatedNewerMessage = updatedConversationState!.Messages!.find((m) => m.ID === 'newer-message');
                const updatedDraftMessage = updatedConversationState!.Messages!.find((m) => m.ID === 'draft-message');

                expect(updatedOlderMessage!.Unread).toBe(0);
                expect(updatedNewerMessage!.Unread).toBe(1); // This should be marked as unread
                expect(updatedDraftMessage!.Unread).toBe(0); // Draft should not be marked
            });

            it('should not mark any message as unread if latest message is already unread', () => {
                const alreadyUnreadMessage = {
                    ...mockMessage1,
                    Order: 1,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                    Unread: 1, // Already unread
                    Flags: 1, // FLAG_RECEIVED
                };

                const conversationWithUnreadMessage = {
                    ...mockConversationState,
                    Messages: [alreadyUnreadMessage],
                };
                state[conversationID] = conversationWithUnreadMessage;

                const conversations = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                // Message should remain unread (no change)
                expect(updatedConversationState!.Messages![0].Unread).toBe(1);
            });

            it('should mark category label as unread when conversation is in inbox', () => {
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                        ContextNumUnread: 0,
                    },
                ];

                mockConversationState = {
                    Conversation: mockConversation,
                    Messages: [mockMessage1, mockMessage2, mockMessage3],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };

                state = {
                    [conversationID]: mockConversationState,
                } as Draft<ConversationsState>;

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations: [mockConversation],
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const inboxLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                const categoryLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS
                );

                expect(inboxLabel?.ContextNumUnread).toBe(1);
                expect(categoryLabel?.ContextNumUnread).toBe(1);
            });

            it('should not mark category label as unread when conversation is in inbox but action is for a different label', () => {
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                        ContextNumUnread: 0,
                    },
                ];

                mockConversationState = {
                    Conversation: mockConversation,
                    Messages: [mockMessage1, mockMessage2, mockMessage3],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };

                state = {
                    [conversationID]: mockConversationState,
                } as Draft<ConversationsState>;

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations: [mockConversation],
                            labelID: MAILBOX_LABEL_IDS.TRASH,
                        },
                    },
                });

                const inboxLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                const trashLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.TRASH
                );
                const categoryLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS
                );

                expect(inboxLabel?.ContextNumUnread).toBe(0);
                expect(trashLabel?.ContextNumUnread).toBe(1);
                expect(categoryLabel?.ContextNumUnread).toBe(0);
            });

            it('should not mark category label as unread when conversation is not in inbox', () => {
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumUnread: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                        ContextNumUnread: 0,
                    },
                ];

                mockConversationState = {
                    Conversation: mockConversation,
                    Messages: [mockMessage1, mockMessage2, mockMessage3],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };

                state = {
                    [conversationID]: mockConversationState,
                } as Draft<ConversationsState>;

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            conversations: [mockConversation],
                            labelID: MAILBOX_LABEL_IDS.TRASH,
                        },
                    },
                });

                const trashLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.TRASH
                );
                const categoryLabel = state[conversationID]?.Conversation.Labels?.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS
                );

                expect(trashLabel?.ContextNumUnread).toBe(1);
                expect(categoryLabel?.ContextNumUnread).toBe(0);
            });
        });
    });

    describe('Only targeted message should be updated', () => {
        describe('markMessagesAsReadPending', () => {
            it('should only update the targeted message, not other messages in the conversation', () => {
                mockMessage1.Unread = 1;
                mockMessage2.Unread = 1;

                const messages = [mockMessage1];

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // message 1 is read
                const updatedMessage1 = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage1!.Unread).toBe(0);

                // message 2 and 3 are unchanged
                const updatedMessage2 = updatedConversationState!.Messages!.find((m) => m.ID === messageID2);
                expect(updatedMessage2!.Unread).toBe(1);
                const updatedMessage3 = updatedConversationState!.Messages!.find((m) => m.ID === messageID3);
                expect(updatedMessage3!.Unread).toBe(0);
            });
        });

        describe('markMessagesAsUnreadPending', () => {
            it('should only update the targeted message, not other messages in the conversation', () => {
                mockMessage1.Unread = 0;
                mockMessage2.Unread = 0;
                mockMessage3.Unread = 0;
                mockConversation.ContextNumUnread = 0;
                mockConversation.NumUnread = 0;

                const messages: MessageMetadata[] = [mockMessage1];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            labelID: MAILBOX_LABEL_IDS.INBOX,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // message 1 is unread
                const updatedMessage1 = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage1!.Unread).toBe(1);

                // message 2 and 3 are unchanged
                const updatedMessage2 = updatedConversationState!.Messages!.find((m) => m.ID === messageID2);
                expect(updatedMessage2!.Unread).toBe(0);
                const updatedMessage3 = updatedConversationState!.Messages!.find((m) => m.ID === messageID3);
                expect(updatedMessage3!.Unread).toBe(0);
            });
        });

        describe('labelMessagesPending', () => {
            const customLabelID = 'custom-label-1';
            const mockLabel: Label = {
                ID: customLabelID,
                Name: 'Custom Label',
                Color: '#ff0000',
                Type: 1,
                Path: 'Custom Label',
                Order: 1,
            } as Label;

            it('should only add label to the targeted message, not other messages in the conversation', () => {
                mockMessage1.LabelIDs = [MAILBOX_LABEL_IDS.INBOX];
                mockMessage2.LabelIDs = [MAILBOX_LABEL_IDS.INBOX];
                mockMessage3.LabelIDs = [MAILBOX_LABEL_IDS.DRAFTS];

                const messages: MessageMetadata[] = [mockMessage1];

                labelMessagesPending(state, {
                    type: 'labelMessages/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                            destinationLabelID: customLabelID,
                            labels: [mockLabel],
                            folders: [],
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // message 1 is labelled
                const updatedMessage1 = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage1!.LabelIDs).toContain(customLabelID);

                // message2 and 3 are unchanged
                const updatedMessage2 = updatedConversationState!.Messages!.find((m) => m.ID === messageID2);
                expect(updatedMessage2!.LabelIDs).not.toContain(customLabelID);
                const updatedMessage3 = updatedConversationState!.Messages!.find((m) => m.ID === messageID3);
                expect(updatedMessage3!.LabelIDs).not.toContain(customLabelID);
            });
        });

        describe('labelMessagesPending - category handling', () => {
            it('should preserve category label when moving message from INBOX to ARCHIVE', () => {
                // Message 1 has CATEGORY_NEWSLETTERS and INBOX
                mockMessage1.LabelIDs = [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS];
                // Conversation has both INBOX and CATEGORY_NEWSLETTERS labels
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 0,
                        ContextNumUnread: 0,
                    },
                ];

                mockConversationState = {
                    Conversation: mockConversation,
                    Messages: [mockMessage1, mockMessage2, mockMessage3],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };
                state = {
                    [conversationID]: mockConversationState,
                } as Draft<ConversationsState>;

                const messages: MessageMetadata[] = [mockMessage1];

                labelMessagesPending(state, {
                    type: 'labelMessages/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                            destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                            labels: [],
                            folders: [],
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // CATEGORY_NEWSLETTERS ContextNumMessages should NOT change (category persists on message)
                const categoryLabel = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS
                );
                expect(categoryLabel?.ContextNumMessages).toBe(2);

                // INBOX ContextNumMessages should decrease
                const inboxLabel = updatedConversationState!.Conversation.Labels!.find(
                    (label) => label.ID === MAILBOX_LABEL_IDS.INBOX
                );
                expect(inboxLabel?.ContextNumMessages).toBe(1);

                // Message LabelIDs should include CATEGORY_NEWSLETTERS and ARCHIVE but not INBOX
                const updatedMessage = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS);
                expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.ARCHIVE);
                expect(updatedMessage!.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.INBOX);
            });

            it('should replace old category with new category when moving between categories', () => {
                mockMessage1.LabelIDs = [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL];
                mockConversation.Labels = [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                    },
                ];

                mockConversationState = {
                    Conversation: mockConversation,
                    Messages: [mockMessage1, mockMessage2, mockMessage3],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };
                state = {
                    [conversationID]: mockConversationState,
                } as Draft<ConversationsState>;

                const messages: MessageMetadata[] = [mockMessage1];

                labelMessagesPending(state, {
                    type: 'labelMessages/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                            destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                            labels: [],
                            folders: [],
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // Message should have new category and not old category
                const updatedMessage = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
                expect(updatedMessage!.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
                // INBOX should still be present (categories don't remove folders)
                expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.INBOX);
            });
        });

        describe('unlabelMessagesPending', () => {
            const customLabelID = 'custom-label-1';
            const mockLabel: Label = {
                ID: customLabelID,
                Name: 'Custom Label',
                Color: '#ff0000',
                Type: 1,
                Path: 'Custom Label',
                Order: 1,
            } as Label;

            it('should only remove label from the targeted message, not other messages in the conversation', () => {
                mockMessage1.LabelIDs = [MAILBOX_LABEL_IDS.INBOX, customLabelID];
                mockMessage2.LabelIDs = [MAILBOX_LABEL_IDS.INBOX, customLabelID];
                mockMessage3.LabelIDs = [MAILBOX_LABEL_IDS.DRAFTS, customLabelID];

                const messages: MessageMetadata[] = [mockMessage1];

                unlabelMessagesPending(state, {
                    type: 'unlabelMessages/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            destinationLabelID: customLabelID,
                            labels: [mockLabel],
                            folders: [],
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                // message 1 is unlabelled
                const updatedMessage1 = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage1!.LabelIDs).not.toContain(customLabelID);

                // message 2 and 3 are unchanged
                const updatedMessage2 = updatedConversationState!.Messages!.find((m) => m.ID === messageID2);
                expect(updatedMessage2!.LabelIDs).toContain(customLabelID);
                const updatedMessage3 = updatedConversationState!.Messages!.find((m) => m.ID === messageID3);
                expect(updatedMessage3!.LabelIDs).toContain(customLabelID);
            });

            it('should not remove category label when unlabeling a custom label', () => {
                mockMessage1.LabelIDs = [MAILBOX_LABEL_IDS.INBOX, customLabelID, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL];

                const messages: MessageMetadata[] = [mockMessage1];

                unlabelMessagesPending(state, {
                    type: 'unlabelMessages/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            messages,
                            destinationLabelID: customLabelID,
                            labels: [mockLabel],
                            folders: [],
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();

                const updatedMessage1 = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
                expect(updatedMessage1!.LabelIDs).not.toContain(customLabelID);
                expect(updatedMessage1!.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
                expect(updatedMessage1!.LabelIDs).toContain(MAILBOX_LABEL_IDS.INBOX);
            });
        });
    });

    describe('unlabelConversationsPending - category handling', () => {
        it('should not remove category label when unlabeling a custom label from conversation', () => {
            const customLabelID = 'custom-label-1';
            const mockLabel: Label = {
                ID: customLabelID,
                Name: 'Custom Label',
                Color: '#ff0000',
                Type: 1,
                Path: 'Custom Label',
                Order: 1,
            } as Label;

            mockMessage1.LabelIDs = [MAILBOX_LABEL_IDS.INBOX, customLabelID, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL];
            mockConversation.Labels = [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                },
                {
                    ID: customLabelID,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                },
            ];

            mockConversationState = {
                Conversation: mockConversation,
                Messages: [mockMessage1, mockMessage2, mockMessage3],
                loadRetry: 0,
                errors: { network: [], unknown: [] },
            };
            state = {
                [conversationID]: mockConversationState,
            } as Draft<ConversationsState>;

            unlabelConversationsPending(state, {
                type: 'mailbox/unlabelConversations/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [mockConversation],
                        destinationLabelID: customLabelID,
                        labels: [mockLabel],
                    },
                },
            });

            const updatedConversationState = state[conversationID];
            expect(updatedConversationState).toBeDefined();

            // CATEGORY_SOCIAL label should be preserved
            const categoryLabel = updatedConversationState!.Conversation.Labels!.find(
                (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL
            );
            expect(categoryLabel).toBeDefined();
            expect(categoryLabel?.ContextNumMessages).toBe(2);

            // Custom label should be removed
            const customLabel = updatedConversationState!.Conversation.Labels!.find(
                (label) => label.ID === customLabelID
            );
            expect(customLabel).toBeUndefined();

            // Message should still have CATEGORY_SOCIAL in LabelIDs
            const updatedMessage = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
            expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(updatedMessage!.LabelIDs).not.toContain(customLabelID);
        });
    });

    describe('labelConversationsPending - category handling', () => {
        it('should preserve CATEGORY_SOCIAL label with ContextNumMessages when moving from INBOX to ARCHIVE', () => {
            const categoryMessage: Message = {
                ID: messageID1,
                ConversationID: conversationID,
                Unread: 1,
                Order: 1,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
                Flags: 1,
            } as Message;

            const categoryConversation = {
                ID: conversationID,
                Subject: 'Test Conversation',
                ContextNumUnread: 1,
                NumUnread: 1,
                NumMessages: 2,
                NumAttachments: 0,
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ],
            } as Conversation;

            const categoryConversationState: ConversationState = {
                Conversation: categoryConversation,
                Messages: [categoryMessage],
                loadRetry: 0,
                errors: { network: [], unknown: [] },
            };

            state = {
                [conversationID]: categoryConversationState,
            } as Draft<ConversationsState>;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversations/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [categoryConversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: [] as Label[],
                        folders: [] as Folder[],
                    },
                },
            });

            const updatedConversationState = state[conversationID];
            expect(updatedConversationState).toBeDefined();

            // CATEGORY_SOCIAL label should be preserved with ContextNumMessages unchanged
            const categoryLabel = updatedConversationState!.Conversation.Labels!.find(
                (label) => label.ID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL
            );
            expect(categoryLabel).toBeDefined();
            expect(categoryLabel?.ContextNumMessages).toBe(2);

            // ARCHIVE label should be added
            const archiveLabel = updatedConversationState!.Conversation.Labels!.find(
                (label) => label.ID === MAILBOX_LABEL_IDS.ARCHIVE
            );
            expect(archiveLabel).toBeDefined();

            // Message should still have CATEGORY_SOCIAL in LabelIDs
            const updatedMessage = updatedConversationState!.Messages!.find((m) => m.ID === messageID1);
            expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
        });

        it('should replace old category with new category and keep everything else unchanged', () => {
            const categoryMessage: Message = {
                ID: messageID1,
                ConversationID: conversationID,
                Unread: 1,
                Order: 1,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
                Flags: 1,
            } as Message;

            const categoryConversation = {
                ID: conversationID,
                Subject: 'Test Conversation',
                ContextNumUnread: 1,
                NumUnread: 1,
                NumMessages: 1,
                NumAttachments: 0,
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ],
            } as Conversation;

            state = {
                [conversationID]: {
                    Conversation: categoryConversation,
                    Messages: [categoryMessage],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                },
            } as Draft<ConversationsState>;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversations/pending',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [categoryConversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        labels: [] as Label[],
                        folders: [] as Folder[],
                    },
                },
            });

            const updated = state[conversationID]!;

            // Old category should be removed (ContextNumMessages zeroed, then filtered)
            const oldCategory = updated.Conversation.Labels!.find((l) => l.ID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(oldCategory).toBeUndefined();

            // New category should be added
            const newCategory = updated.Conversation.Labels!.find(
                (l) => l.ID === MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS
            );
            expect(newCategory).toBeDefined();
            expect(newCategory?.ContextNumMessages).toBe(1);

            // INBOX should be unchanged
            const inboxLabel = updated.Conversation.Labels!.find((l) => l.ID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxLabel).toBeDefined();
            expect(inboxLabel?.ContextNumMessages).toBe(1);

            // STARRED should be unchanged
            const starredLabel = updated.Conversation.Labels!.find((l) => l.ID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredLabel).toBeDefined();
            expect(starredLabel?.ContextNumMessages).toBe(1);

            // Message should have new category, not old, and keep INBOX + STARRED
            const updatedMessage = updated.Messages!.find((m) => m.ID === messageID1);
            expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            expect(updatedMessage!.LabelIDs).not.toContain(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.INBOX);
            expect(updatedMessage!.LabelIDs).toContain(MAILBOX_LABEL_IDS.STARRED);
        });
    });
});
