import type { Draft } from 'immer';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message, MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from '../../models/conversation';
import type { Element } from '../../models/element';
import {
    markConversationsAsReadPending,
    markConversationsAsUnreadPending,
    markMessagesAsReadPending,
    markMessagesAsUnreadPending,
} from './conversationsReducers';
import type { ConversationState, ConversationsState } from './conversationsTypes';

describe('conversationsReducers', () => {
    const inboxLabelID = MAILBOX_LABEL_IDS.INBOX;
    const archiveLabelID = MAILBOX_LABEL_IDS.ARCHIVE;
    const draftLabelID = MAILBOX_LABEL_IDS.DRAFTS;
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
            LabelIDs: [inboxLabelID],
            Flags: 1, // FLAG_RECEIVED
        } as Message;

        mockMessage2 = {
            ID: messageID2,
            ConversationID: conversationID,
            Unread: 1,
            Order: 2,
            LabelIDs: [inboxLabelID, archiveLabelID],
            Flags: 1, // FLAG_RECEIVED
        } as Message;

        mockMessage3 = {
            ID: messageID3,
            ConversationID: conversationID,
            Unread: 0,
            Order: 3,
            LabelIDs: [draftLabelID],
            Flags: 1, // FLAG_RECEIVED
        } as Message;

        mockConversation = {
            ID: conversationID,
            Subject: 'Test Conversation',
            ContextNumUnread: 2,
            NumUnread: 2,
            Labels: [
                {
                    ID: inboxLabelID,
                    ContextNumUnread: 2,
                },
                {
                    ID: archiveLabelID,
                    ContextNumUnread: 1,
                },
                {
                    ID: draftLabelID,
                    ContextNumUnread: 0,
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
                const elements = [mockMessage1, mockMessage2];

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
                const label = updatedConversationState!.Conversation.Labels!.find((label) => label.ID === inboxLabelID);
                expect(label?.ContextNumUnread).toBe(0);
            });

            it('should skip already read messages', () => {
                const readMessage = { ...mockMessage1, Unread: 0 };
                const elements = [readMessage];

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                const elements = [mockMessage1]; // Only one message

                markMessagesAsReadPending(state, {
                    type: 'markMessagesAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                const label = updatedConversationState!.Conversation.Labels!.find((label) => label.ID === inboxLabelID);
                expect(label?.ContextNumUnread).toBe(1);
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
                const elements = [mockMessage1, mockMessage2];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(2);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(2);
                const label = updatedConversationState!.Conversation.Labels!.find((label) => label.ID === inboxLabelID);
                expect(label?.ContextNumUnread).toBe(2);
            });

            it('should skip already unread messages', () => {
                const unreadMessage = { ...mockMessage1, Unread: 1 };
                const elements = [unreadMessage];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                const elements: MessageMetadata[] = [messageWithDifferentLabel];

                markMessagesAsUnreadPending(state, {
                    type: 'markMessagesAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                // Label should not be updated since message doesn't have this label
                const label = updatedConversationState!.Conversation.Labels!.find((label) => label.ID === inboxLabelID);
                expect(label?.ContextNumUnread).toBe(0);
            });
        });
    });

    describe('Mark conversations as read', () => {
        describe('markConversationsAsReadPending', () => {
            it('should mark unread conversation as read', () => {
                const elements: Element[] = [mockConversation];

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                    Labels: [{ ID: inboxLabelID, ContextNumUnread: 0 }],
                };
                const elements: Element[] = [readConversation];

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                const elements: Element[] = [mockConversation];

                markConversationsAsReadPending(state, {
                    type: 'markConversationsAsRead/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(0);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(0);
                expect(updatedConversationState!.Messages!.every((message) => message.Unread === 0)).toBe(true);
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
                const elements: Element[] = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                expect(updatedConversationState!.Conversation.ContextNumUnread).toBe(1);
                expect(updatedConversationState!.Conversation.NumUnread).toBe(1);
                const label = updatedConversationState!.Conversation.Labels!.find((label) => label.ID === inboxLabelID);
                expect(label?.ContextNumUnread).toBe(1);
            });

            it('should skip already unread conversations', () => {
                const unreadConversation = {
                    ...mockConversation,
                    Labels: [{ ID: inboxLabelID, ContextNumUnread: 1 }],
                };
                const elements: Element[] = [unreadConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                const elements: Element[] = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
                        },
                    },
                });

                const updatedConversationState = state[conversationID];
                expect(updatedConversationState).toBeDefined();
                const label = updatedConversationState!.Conversation.Labels!.find((label) => label.ID === inboxLabelID);
                expect(label?.ContextNumUnread).toBe(1);
            });

            it('should mark the last non draft message of the current location as unread', () => {
                const elements: Element[] = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                    LabelIDs: [inboxLabelID, draftLabelID],
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
                                ID: inboxLabelID,
                                ContextNumUnread: 0,
                            },
                        ],
                    },
                    Messages: [draftMessage],
                    loadRetry: 0,
                    errors: { network: [], unknown: [] },
                };
                state[conversationID] = conversationWithOnlyDrafts;

                const elements: Element[] = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                    LabelIDs: [inboxLabelID],
                    Unread: 0,
                    Flags: 1, // FLAG_RECEIVED
                };
                const newerMessage = {
                    ...mockMessage2,
                    ID: 'newer-message',
                    Order: 3,
                    LabelIDs: [inboxLabelID],
                    Unread: 0,
                    Flags: 1, // FLAG_RECEIVED
                };
                const draftMessage = {
                    ...mockMessage3,
                    ID: 'draft-message',
                    Order: 4,
                    LabelIDs: [inboxLabelID, draftLabelID],
                    Flags: 0, // Draft: no sent/received flags
                    Unread: 0,
                };

                const conversationWithMultipleMessages = {
                    ...mockConversationState,
                    Messages: [olderMessage, newerMessage, draftMessage],
                };
                state[conversationID] = conversationWithMultipleMessages;

                const elements: Element[] = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
                    LabelIDs: [inboxLabelID],
                    Unread: 1, // Already unread
                    Flags: 1, // FLAG_RECEIVED
                };

                const conversationWithUnreadMessage = {
                    ...mockConversationState,
                    Messages: [alreadyUnreadMessage],
                };
                state[conversationID] = conversationWithUnreadMessage;

                const elements: Element[] = [mockConversation];

                markConversationsAsUnreadPending(state, {
                    type: 'markConversationsAsUnread/pending',
                    payload: undefined,
                    meta: {
                        arg: {
                            elements,
                            labelID: inboxLabelID,
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
        });
    });
});
