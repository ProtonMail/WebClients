import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CONVERSATION_ID,
    CUSTOM_LABEL_ID1,
    MESSAGE_ID,
    customFolders,
    customLabels,
    expectConversationLabelsSameArray,
    expectMessagesLabelsSameArray,
    setupConversation,
    setupMessage,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

import { unlabelMessagesPending } from '../elementsReducers';

describe('unlabelMessagesPending', () => {
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

    it('should do nothing when trying to unlabel a message', () => {
        const message = setupMessage({
            messageID: MESSAGE_ID,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
        });

        testState.elements = {
            [MESSAGE_ID]: message,
        };

        unlabelMessagesPending(testState, {
            type: 'mailbox/unlabelMessages',
            payload: undefined,
            meta: {
                arg: {
                    messages: [message],
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                    sourceLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                },
            },
        });

        const updatedMessage = testState.elements[MESSAGE_ID] as Message;
        expect(updatedMessage.Unread).toEqual(1);
        expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        ]);
    });

    it('should remove STARRED when unlabeling a message', () => {
        const message = setupMessage({
            messageID: MESSAGE_ID,
            unreadState: 'unread',
            labelIDs: [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.STARRED,
            ],
        });

        testState.elements = {
            [MESSAGE_ID]: message,
        };

        unlabelMessagesPending(testState, {
            type: 'mailbox/unlabelMessages',
            payload: undefined,
            meta: {
                arg: {
                    messages: [message],
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                },
            },
        });

        const updatedMessage = testState.elements[MESSAGE_ID] as Message;
        expect(updatedMessage.Unread).toEqual(1);
        expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        ]);
    });

    it('should remove STARRED when unlabeling a message', () => {
        const message = setupMessage({
            messageID: MESSAGE_ID,
            unreadState: 'unread',
            labelIDs: [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                CUSTOM_LABEL_ID1,
            ],
        });

        testState.elements = {
            [MESSAGE_ID]: message,
        };

        unlabelMessagesPending(testState, {
            type: 'mailbox/unlabelMessages',
            payload: undefined,
            meta: {
                arg: {
                    messages: [message],
                    destinationLabelID: CUSTOM_LABEL_ID1,
                    sourceLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                },
            },
        });

        const updatedMessage = testState.elements[MESSAGE_ID] as Message;
        expect(updatedMessage.Unread).toEqual(1);
        expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        ]);
    });

    describe('Remove a label on the conversation', () => {
        it('should remove the label from the converastion when', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
                attachments: [{ Name: 'att' }] as Attachment[],
            });

            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numMessages: 2,
                numUnread: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [MESSAGE_ID]: message,
            };

            unlabelMessagesPending(testState, {
                type: 'mailbox/unlabelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        destinationLabelID: CUSTOM_LABEL_ID1,
                        sourceLabelID: MAILBOX_LABEL_IDS.STARRED,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedMessage = testState.elements[MESSAGE_ID] as Message;
            expect(updatedMessage.Unread).toEqual(1);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            ]);

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;
            expect(updatedConversation.NumMessages).toBe(2);
            expect(updatedConversation.NumUnread).toBe(2);
            expect(updatedConversation.NumAttachments).toBe(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: CUSTOM_LABEL_ID1,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
            ]);
        });
    });
});
