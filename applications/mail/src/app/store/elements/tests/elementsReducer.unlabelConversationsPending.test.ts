import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CONVERSATION_ID,
    CUSTOM_LABEL_ID1,
    customFolders,
    customLabels,
    expectConversationLabelsSameArray,
    setupConversation,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

import { unlabelConversationsPending } from '../elementsReducers';

describe('unLabelConversationsPending', () => {
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

    it('should do nothing when trying to unlabel a folder', () => {
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

        unlabelConversationsPending(testState, {
            type: 'mailbox/unlabelConversations',
            payload: undefined,
            meta: {
                arg: {
                    conversations: [conversation],
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
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
        ]);
    });

    it('should decrease STARRED count when no conversation items are remaining in label', () => {
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

        unlabelConversationsPending(testState, {
            type: 'mailbox/unlabelConversations',
            payload: undefined,
            meta: {
                arg: {
                    conversations: [conversation],
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
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
        ]);
    });

    it('should decrease custom label count', () => {
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

        unlabelConversationsPending(testState, {
            type: 'mailbox/unlabelConversations',
            payload: undefined,
            meta: {
                arg: {
                    conversations: [conversation],
                    destinationLabelID: CUSTOM_LABEL_ID1,
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
        ]);
    });
});
