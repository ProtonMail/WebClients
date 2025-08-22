import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { getElementContextIdentifier } from 'proton-mail/helpers/elements';
import type { ConversationLabel } from 'proton-mail/models/conversation';
import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';

import {
    labelConversationsPending,
    labelMessagesPending,
    unlabelConversationsPending,
    unlabelMessagesPending,
} from '../elementsReducers';
import {
    CONVERSATION_ID,
    CUSTOM_LABEL_ID1,
    MESSAGE_ID,
    customFolders,
    customLabels,
    setupConversation,
    setupMessage,
} from './elementsReducer.test.helpers';

describe('Update context Total', () => {
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

    describe('labelConversation', () => {
        it('should update the source and target label ids total', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
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

            const archiveConversationID = 'archiveConv';
            const inboxConversationID = 'inboxConv';

            const inputArchiveConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 1,
                conversationID: archiveConversationID,
            });

            const inputInboxConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 1,
                conversationID: inboxConversationID,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [archiveConversationID]: inputArchiveConversation,
                [inboxConversationID]: inputInboxConversation,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            });
        });

        it('should update the source and not the target label ids total if conversation already in target', () => {
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
                        ContextNumUnread: 0,
                        ContextNumAttachments: 0,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
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

            const archiveConversationID = 'archiveConv';
            const inboxConversationID = 'inboxConv';

            const inputArchiveConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 1,
                conversationID: archiveConversationID,
            });

            const inputInboxConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 1,
                conversationID: inboxConversationID,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [archiveConversationID]: inputArchiveConversation,
                [inboxConversationID]: inputInboxConversation,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            });
        });

        it('should update the context total with filters', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
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

            const archiveConversationID = 'archiveConv';
            const inboxConversationID = 'inboxConv';

            const inputArchiveConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 1,
                conversationID: archiveConversationID,
            });

            const inputInboxConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 0,
                numMessages: 1,
                numAttachments: 1,
                conversationID: inboxConversationID,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [archiveConversationID]: inputArchiveConversation,
                [inboxConversationID]: inputInboxConversation,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 1 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 0 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 0 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            });
        });

        it('should update custom labels, STARRED, and unread context total when moving to TRASH', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
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

            const trashConversationID = 'trashConv';
            const inboxConversationID = 'inboxConv';

            const inputTrashConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 0,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 0,
                numMessages: 1,
                numAttachments: 1,
                conversationID: trashConversationID,
            });

            const inputInboxConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 0,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 0,
                numMessages: 1,
                numAttachments: 1,
                conversationID: inboxConversationID,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [trashConversationID]: inputTrashConversation,
                [inboxConversationID]: inputInboxConversation,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.TRASH,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.STARRED,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 3,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    filter: { Unread: 1 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            };

            labelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.TRASH,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 3,
            });
        });
    });

    describe('unlabelConversation', () => {
        it('should update the label context total', () => {
            const conversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            const inboxConversationID = 'inboxConv';

            const inputInboxConversation = setupConversation({
                conversationLabels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                numUnread: 1,
                numMessages: 1,
                numAttachments: 1,
                conversationID: inboxConversationID,
            });

            testState.elements = {
                [CONVERSATION_ID]: conversation,
                [inboxConversationID]: inputInboxConversation,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 1,
            };

            unlabelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
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

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: true,
                })]: 2,
            });
        });
    });

    describe('labelMessage', () => {
        it('should update the source and target label ids total', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });

            const archiveMessageID = 'archiveMsg';
            const inboxMessageID = 'inboxMsg';

            const inputArchiveMessage = setupMessage({
                messageID: archiveMessageID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            const inputInboxMessage = setupMessage({
                messageID: inboxMessageID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
                [archiveMessageID]: inputArchiveMessage,
                [inboxMessageID]: inputInboxMessage,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        elements: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
            });
        });

        it('should update the context total with filters', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });

            const archiveMessageID = 'archiveMsg';
            const inboxMessageID = 'inboxMsg';

            const inputArchiveMessage = setupMessage({
                messageID: archiveMessageID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            const inputInboxMessage = setupMessage({
                messageID: inboxMessageID,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
                [archiveMessageID]: inputArchiveMessage,
                [inboxMessageID]: inputInboxMessage,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 1 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 0 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        elements: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: { Unread: 0 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
            });
        });

        it('should update custom labels, STARRED, and unread context total when moving to TRASH', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                    CUSTOM_LABEL_ID1,
                ],
            });

            const trashMessageID = 'trashMsg';
            const inboxMessageID = 'inboxMsg';

            const inputTrashMessage = setupMessage({
                messageID: trashMessageID,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            const inputInboxMessage = setupMessage({
                messageID: inboxMessageID,
                unreadState: 'read',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
                [trashMessageID]: inputTrashMessage,
                [inboxMessageID]: inputInboxMessage,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 3,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    filter: { Unread: 1 },
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.TRASH,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.STARRED,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        elements: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 3,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.TRASH,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
            });
        });
    });

    describe('unlabelMessage', () => {
        it('should update the label context total', () => {
            const message = setupMessage({
                messageID: MESSAGE_ID,
                unreadState: 'unread',
                labelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });

            const inboxMessageID = 'inboxMsg';

            const inputInboxMessage = setupMessage({
                messageID: inboxMessageID,
                unreadState: 'unread',
                labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
            });

            testState.elements = {
                [MESSAGE_ID]: message,
                [inboxMessageID]: inputInboxMessage,
            };

            testState.total = {
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
                [getElementContextIdentifier({
                    labelID: CUSTOM_LABEL_ID1,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 1,
            };

            unlabelMessagesPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        elements: [message],
                        destinationLabelID: CUSTOM_LABEL_ID1,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [getElementContextIdentifier({
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    filter: {},
                    sort: { sort: 'Time', desc: true },
                    conversationMode: false,
                })]: 2,
            });
        });
    });
});
