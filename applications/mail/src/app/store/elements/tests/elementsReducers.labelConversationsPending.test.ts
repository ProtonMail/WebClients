import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';
import { labelConversationsPending } from 'proton-mail/store/elements/elementsReducers';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CONVERSATION_ID,
    CUSTOM_FOLDER_ID1,
    CUSTOM_LABEL_ID1,
    CUSTOM_LABEL_ID2,
    customFolders,
    customLabels,
    expectConversationLabelsSameArray,
    expectMessagesLabelsSameArray,
    setupConversation,
    setupMessageFromConversation,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

describe('labelConversationsPending', () => {
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

    describe('Labels are removed when move to TRASH or SPAM', () => {
        it('should remove STARRED if conversation is moved to TRASH', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(2);
            expect(updatedConversation.NumUnread).toEqual(0);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.TRASH,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should remove STARRED if conversation is moved to SPAM', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(2);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.SPAM,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should remove custom labels if conversation is moved to TRASH', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(2);
            expect(updatedConversation.NumUnread).toEqual(0);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.TRASH,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should remove custom labels if conversation is moved to SPAM', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(2);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.SPAM,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should remove the conversation from ALMOST_ALL_MAIL if conversation is moved to TRASH', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(2);
            expect(updatedConversation.NumUnread).toEqual(0);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.TRASH,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should remove the conversation from ALMOST_ALL_MAIL if conversation is moved to SPAM', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 2,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(2);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.SPAM,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Unmodifiable labels should not be updated', () => {
        it('should not update unmodifiable labels', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SCHEDULED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                        ID: MAILBOX_LABEL_IDS.SNOOZED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.SCHEDULED,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                    ID: MAILBOX_LABEL_IDS.SNOOZED,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 4,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Move to INBOX', () => {
        it('should move all received messages to INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 4, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all received messages to INBOX when no message was in INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 3,
                numAttachments: 0,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(0);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3, ContextNumUnread: 1, ContextNumAttachments: 0 },
            ]);
        });

        it('should move all sent messages to SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all sent messages to SENT when no message was in SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
            ]);
        });

        it('should move all drafts messages to DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all drafts messages to DRAFTS when no message was in DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
            ]);
        });

        it('should keep messages in STARRED', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: MAILBOX_LABEL_IDS.STARRED, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep messages in custom label', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep messages in categories', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Move to a category', () => {
        it('should move messages to the new category', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep all messages in INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.TRASH,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep sent messages in SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep all drafts messages in DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.DRAFTS,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep all messages in STARRED', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.STARRED,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep all messages in custom label', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 2,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Move to SENT', () => {
        it('should move all received messages to INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 4, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all received messages to INBOX when no message was in INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 3,
                numAttachments: 0,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(0);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3, ContextNumUnread: 1, ContextNumAttachments: 0 },
            ]);
        });

        it('should move all sent messages to SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all sent messages to SENT when no message was in SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
            ]);
        });

        it('should move all drafts messages to DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all drafts messages to DRAFTS when no message was in DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
            ]);
        });

        it('should keep messages in STARRED', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: MAILBOX_LABEL_IDS.STARRED, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep messages in custom label', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep messages in categories', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.SENT,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Move to DRAFTS', () => {
        it('should move all received messages to INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 4, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all received messages to INBOX when no message was in INBOX', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 3,
                numAttachments: 0,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(0);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3, ContextNumUnread: 1, ContextNumAttachments: 0 },
            ]);
        });

        it('should move all sent messages to SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all sent messages to SENT when no message was in SENT', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
            ]);
        });

        it('should move all drafts messages to DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all drafts messages to DRAFTS when no message was in DRAFTS', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
            ]);
        });

        it('should keep messages in STARRED', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: MAILBOX_LABEL_IDS.STARRED, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep messages in custom label', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_LABEL_ID1, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep messages in categories', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2, ContextNumUnread: 2, ContextNumAttachments: 1 },
                { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 2, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Move to label', () => {
        it('should keep all messages in their current locations when moving to STARRED', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.STARRED,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should keep all messages in their current locations when moving to custom label', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        targetLabelID: CUSTOM_LABEL_ID2,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 0,
                },
                { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                {
                    ID: MAILBOX_LABEL_IDS.SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: CUSTOM_LABEL_ID2,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Default scenario', () => {
        it('should move all items to their destination and remove them from their previous folders', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all items to their destination and stay in STARRED', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.STARRED,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all items to their destination and stay in custom labels', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: CUSTOM_LABEL_ID1,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });

        it('should move all items to their destination and stay in category', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    { ID: CUSTOM_FOLDER_ID1, ContextNumMessages: 1, ContextNumUnread: 0, ContextNumAttachments: 0 },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 2,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(2);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 2,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ARCHIVE,
                    ContextNumMessages: 4,
                    ContextNumUnread: 2,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Add elements back to ALMOST_ALL_MAIL', () => {
        it('should add back TRASH and SPAM messages to ALMOST_ALL_MAIL', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SPAM,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 4,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 4,
                numAttachments: 1,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(4);
            expect(updatedConversation.NumUnread).toEqual(1);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.INBOX,
                    ContextNumMessages: 4,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 4,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ]);
        });
    });

    describe('Messages from conversation in element state are updated', () => {
        it('should update messages in element state when moving a conversation', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_SENT,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 2,
                numMessages: 3,
                numAttachments: 1,
            });

            const messageID = 'message1';
            const sentMessage = setupMessageFromConversation({
                messageID,
                labelIDs: [
                    MAILBOX_LABEL_IDS.SENT,
                    MAILBOX_LABEL_IDS.ALL_SENT,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
                unreadState: 'unread',
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [messageID]: sentMessage,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedConversation = testState.elements[CONVERSATION_ID] as Conversation;

            expect(updatedConversation.NumMessages).toEqual(3);
            expect(updatedConversation.NumUnread).toEqual(0);
            expect(updatedConversation.NumAttachments).toEqual(1);
            expectConversationLabelsSameArray(updatedConversation.Labels, [
                {
                    ID: MAILBOX_LABEL_IDS.TRASH,
                    ContextNumMessages: 3,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_SENT,
                    ContextNumMessages: 1,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 0,
                },
                {
                    ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    ContextNumMessages: 3,
                    ContextNumUnread: 0,
                    ContextNumAttachments: 1,
                },
            ]);

            const updatedMessage = testState.elements[messageID] as Message;

            expect(updatedMessage.Unread).toEqual(0);
            expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
                MAILBOX_LABEL_IDS.TRASH,
                MAILBOX_LABEL_IDS.ALL_SENT,
                MAILBOX_LABEL_IDS.ALL_MAIL,
            ]);
        });
    });
});
