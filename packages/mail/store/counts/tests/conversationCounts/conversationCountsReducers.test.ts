import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label, LabelCount } from '@proton/shared/lib/interfaces';
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
    const customLabelID = 'custom-label-1';
    const customFolderID = 'custom-folder-1';
    const conversationID1 = 'conversation1';
    const conversationID2 = 'conversation2';
    const messageID1 = 'message1';
    const messageID2 = 'message2';
    let state: Draft<ModelState<LabelCount[]>>;

    const labels: Label[] = [{ ID: customLabelID, Name: 'Custom Label', Type: 1 } as Label];
    const folders: Folder[] = [{ ID: customFolderID, Name: 'Custom Folder' } as Folder];

    describe('markConversationsAsReadPending', () => {
        beforeEach(() => {
            state = getInitialState([
                {
                    LabelID: MAILBOX_LABEL_IDS.INBOX,
                    Unread: 2,
                    Total: 2,
                },
                {
                    LabelID: MAILBOX_LABEL_IDS.TRASH,
                    Unread: 1,
                    Total: 1,
                },
            ]);
        });

        it('should mark the conversation as read in all locations associated with the conversation', () => {
            const conversation1 = {
                ID: conversationID1,
                ContextNumUnread: 1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 }],
            };

            const conversation2 = {
                ID: conversationID2,
                ContextNumUnread: 1,
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 },
                    { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumUnread: 1 },
                ],
            };

            markConversationsAsRead(state, {
                type: 'mailbox/markConversationsAsRead',
                payload: { conversations: [conversation1, conversation2], labelID: MAILBOX_LABEL_IDS.INBOX },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 2 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 1 },
            ]);
        });

        it('should skip update if conversation is already read', () => {
            const conversation1 = {
                ID: conversationID1,
                ContextNumUnread: 0,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 }],
            };

            markConversationsAsRead(state, {
                type: 'mailbox/markConversationsAsRead',
                payload: { conversations: [conversation1], labelID: MAILBOX_LABEL_IDS.INBOX },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 1 },
            ]);
        });
    });

    describe('markConversationsAsUnreadPending', () => {
        beforeEach(() => {
            state = getInitialState([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 2 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 1 },
            ]);
        });

        it('should mark the conversation as unread only in the current location', () => {
            const conversation1 = {
                ID: conversationID1,
                ContextNumUnread: 0,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 }],
            };

            const conversation2 = {
                ID: conversationID2,
                ContextNumUnread: 0,
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumUnread: 0 },
                ],
            };

            markConversationsAsUnread(state, {
                type: 'mailbox/markConversationsAsUnread',
                payload: { conversations: [conversation1, conversation2], labelID: MAILBOX_LABEL_IDS.INBOX },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 1 },
            ]);
        });
    });

    describe('markMessagesAsUnread', () => {
        beforeEach(() => {
            state = getInitialState([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 3 },
            ]);
        });

        it('should increment unread count when conversation becomes unread', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 }],
            };

            const conversation2 = {
                ID: conversationID2,
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 0 },
                    { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumUnread: 0 },
                ],
            };

            const message1 = {
                ID: messageID1,
                ConversationID: conversationID1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 0,
            } as MessageMetadata;

            const message2 = {
                ID: messageID2,
                ConversationID: conversationID2,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.TRASH],
                Unread: 0,
            } as MessageMetadata;

            state.value = [
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 3 },
            ];

            markMessagesAsUnread(state, {
                type: 'mailbox/markMessagesAsUnread',
                payload: {
                    messages: [message1, message2],
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation1, conversation2],
                    folders: [],
                },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 3 }, // Unread state is not updated because we don't know if the conversation is unread in other labels
            ]);
        });

        it('should not increment unread count when conversation is already unread', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 }],
            };

            const message1 = {
                ID: messageID1,
                ConversationID: conversationID1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                Unread: 0,
            } as MessageMetadata;

            markMessagesAsUnread(state, {
                type: 'mailbox/markMessagesAsUnread',
                payload: {
                    messages: [message1],
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation1],
                    folders: [],
                },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 3 },
            ]);
        });
    });

    describe('markMessagesAsRead', () => {
        beforeEach(() => {
            state = getInitialState([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 3 },
            ]);
        });

        it('should decrement unread count when all messages in conversation are read', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
                { ConversationID: conversationID1, ID: 'msg2', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation1],
                    folders: [],
                    labels: [],
                },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 3 },
            ]);
        });

        it('should not decrement when not all messages in conversation are read', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation1],
                    folders: [],
                    labels: [],
                },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 3 },
            ]);
        });

        it('should handle multiple conversations with different message counts', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 }],
            };

            const conversation2 = {
                ID: conversationID2,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
                { ConversationID: conversationID2, ID: 'msg2', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
                { ConversationID: conversationID2, ID: 'msg3', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation1, conversation2],
                    folders: [],
                    labels: [],
                },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 3 },
            ]);
        });

        it('should handle messages from different conversations', () => {
            const conversation1 = {
                ID: conversationID1,
                Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 }],
            };

            const messages = [
                { ConversationID: conversationID1, ID: 'msg1', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
                { ConversationID: 'other-conversation', ID: 'msg2', LabelIDs: [MAILBOX_LABEL_IDS.INBOX], Unread: 1 },
            ] as MessageMetadata[];

            markMessagesAsRead(state, {
                type: 'mailbox/markMessagesAsRead',
                payload: {
                    messages: messages,
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation1],
                    folders: [],
                    labels: [],
                },
            });

            expect(state.value).toEqual([
                { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 3 },
            ]);
        });

        describe('ALL_MAIL counts', () => {
            it('should decrement ALL_MAIL count when all messages in conversation are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 1, Total: 10 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 },
                        { ID: MAILBOX_LABEL_IDS.ALL_MAIL, ContextNumUnread: 2 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 0, Total: 10 },
                ]);
            });

            it('should not decrement ALL_MAIL count when not all messages are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 1, Total: 10 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 },
                        { ID: MAILBOX_LABEL_IDS.ALL_MAIL, ContextNumUnread: 3 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 1, Total: 10 },
                ]);
            });
        });

        describe('ALMOST_ALL_MAIL counts', () => {
            it('should decrement ALMOST_ALL_MAIL when all non-spam/trash messages are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 1, Total: 10 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 },
                        { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, ContextNumUnread: 2 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 0, Total: 10 },
                ]);
            });

            it('should not count spam/trash messages for ALMOST_ALL_MAIL', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 1, Total: 3 },
                    { LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 1, Total: 10 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 },
                        { ID: MAILBOX_LABEL_IDS.SPAM, ContextNumUnread: 1 },
                        { ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, ContextNumUnread: 1 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.SPAM],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                // ALMOST_ALL_MAIL should be decremented because the 1 non-spam message was marked as read
                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 0, Total: 3 },
                    { LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 0, Total: 10 },
                ]);
            });
        });

        describe('STARRED counts', () => {
            it('should decrement STARRED count when all starred messages are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 1, Total: 3 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 },
                        { ID: MAILBOX_LABEL_IDS.STARRED, ContextNumUnread: 1 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.STARRED],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 3 },
                ]);
            });

            it('should not decrement STARRED count when not all starred messages are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 1, Total: 3 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 },
                        { ID: MAILBOX_LABEL_IDS.STARRED, ContextNumUnread: 2 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.STARRED],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 1, Total: 3 },
                ]);
            });
        });

        describe('custom labels counts', () => {
            it('should decrement custom label count when all messages with that label are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: customLabelID, Unread: 1, Total: 3 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 },
                        { ID: customLabelID, ContextNumUnread: 1 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, customLabelID],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: labels,
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: customLabelID, Unread: 0, Total: 3 },
                ]);
            });

            it('should handle messages with multiple custom labels', () => {
                const customLabelID2 = 'custom-label-2';
                const labels = [
                    { ID: customLabelID, Name: 'Custom Label 1', Type: 1 } as Label,
                    { ID: customLabelID2, Name: 'Custom Label 2', Type: 1 } as Label,
                ];

                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: customLabelID, Unread: 1, Total: 3 },
                    { LabelID: customLabelID2, Unread: 1, Total: 2 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 },
                        { ID: customLabelID, ContextNumUnread: 1 },
                        { ID: customLabelID2, ContextNumUnread: 1 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, customLabelID, customLabelID2],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels,
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: customLabelID, Unread: 0, Total: 3 },
                    { LabelID: customLabelID2, Unread: 0, Total: 2 },
                ]);
            });
        });

        describe('category counts', () => {
            it('should decrement category count when all messages in category are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 1, Total: 3 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 2 },
                        { ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, ContextNumUnread: 2 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 0, Total: 3 },
                ]);
            });

            it('should not decrement category count when not all messages are marked as read', () => {
                state = getInitialState([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 1, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: 1, Total: 3 },
                ]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [
                        { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumUnread: 1 },
                        { ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, ContextNumUnread: 3 },
                    ],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: MAILBOX_LABEL_IDS.INBOX,
                        conversations: [conversation],
                        folders: [],
                        labels: [],
                    },
                });

                expect(state.value).toEqual([
                    { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 5 },
                    { LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: 1, Total: 3 }, // Not decremented
                ]);
            });
        });

        describe('custom folders', () => {
            it('should decrement custom folder count when all messages in folder are marked as read', () => {
                state = getInitialState([{ LabelID: customFolderID, Unread: 1, Total: 5 }]);

                const conversation = {
                    ID: conversationID1,
                    Labels: [{ ID: customFolderID, ContextNumUnread: 2 }],
                };

                const messages = [
                    {
                        ConversationID: conversationID1,
                        ID: 'msg1',
                        LabelIDs: [customFolderID],
                        Unread: 1,
                    },
                    {
                        ConversationID: conversationID1,
                        ID: 'msg2',
                        LabelIDs: [customFolderID],
                        Unread: 1,
                    },
                ] as MessageMetadata[];

                markMessagesAsRead(state, {
                    type: 'mailbox/markMessagesAsRead',
                    payload: {
                        messages,
                        labelID: customFolderID,
                        conversations: [conversation],
                        folders: folders,
                        labels: [],
                    },
                });

                expect(state.value).toEqual([{ LabelID: customFolderID, Unread: 0, Total: 5 }]);
            });
        });
    });
});
