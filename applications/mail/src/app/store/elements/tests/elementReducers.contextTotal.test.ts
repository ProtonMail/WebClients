import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

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
    generateElementContextIdentifier,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = true;

            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            const archiveContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                conversationMode: true,
            });
            const customContext = generateElementContextIdentifier({
                labelID: CUSTOM_LABEL_ID1,
                conversationMode: true,
            });

            testState.total = {
                [inboxContext]: 2,
                [archiveContext]: 1,
                [customContext]: 1,
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
                [inboxContext]: 1,
                [archiveContext]: 2,
                [customContext]: 1,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = true;

            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            const archiveContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                conversationMode: true,
            });
            const customContext = generateElementContextIdentifier({
                labelID: CUSTOM_LABEL_ID1,
                conversationMode: true,
            });

            testState.total = {
                [inboxContext]: 2,
                [archiveContext]: 2,
                [customContext]: 1,
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
                [inboxContext]: 1,
                [archiveContext]: 2,
                [customContext]: 1,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = true;

            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            const archiveContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ARCHIVE,
                conversationMode: true,
            });
            const customContext = generateElementContextIdentifier({
                labelID: CUSTOM_LABEL_ID1,
                conversationMode: true,
            });
            const inboxUnreadOnContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
                filter: { Unread: 1 },
            });
            const inboxUnreadOffContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
                filter: { Unread: 0 },
            });

            testState.total = {
                [inboxContext]: 2,
                [inboxUnreadOnContext]: 1,
                [inboxUnreadOffContext]: 1,
                [archiveContext]: 2,
                [customContext]: 1,
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
                [inboxContext]: 1,
                [inboxUnreadOnContext]: 0,
                [inboxUnreadOffContext]: 1,
                [archiveContext]: 3,
                [customContext]: 1,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = true;

            const inboxContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                conversationMode: true,
            });
            const trashContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.TRASH,
                conversationMode: true,
            });
            const starredContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.STARRED,
                conversationMode: true,
            });
            const almostAllMailContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                conversationMode: true,
            });
            const allMailContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                conversationMode: true,
            });
            const allMailUnreadOnContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                conversationMode: true,
                filter: { Unread: 1 },
            });
            const customContext = generateElementContextIdentifier({
                labelID: CUSTOM_LABEL_ID1,
                conversationMode: true,
            });

            testState.total = {
                [inboxContext]: 2,
                [trashContext]: 1,
                [starredContext]: 1,
                [almostAllMailContext]: 2,
                [allMailContext]: 3,
                [allMailUnreadOnContext]: 1,
                [customContext]: 1,
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
                [inboxContext]: 1,
                [trashContext]: 2,
                [starredContext]: 0,
                [almostAllMailContext]: 1,
                [allMailContext]: 3,
                [allMailUnreadOnContext]: 0,
                [customContext]: 0,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = false;

            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const customContext = generateElementContextIdentifier({ labelID: CUSTOM_LABEL_ID1 });

            testState.total = {
                [inboxContext]: 2,
                [customContext]: 1,
            };

            unlabelConversationsPending(testState, {
                type: 'mailbox/labelConversations',
                payload: undefined,
                meta: {
                    arg: {
                        conversations: [conversation],
                        destinationLabelID: CUSTOM_LABEL_ID1,
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [inboxContext]: 2,
                [customContext]: 1,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = false;

            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });
            const customLabelContext = generateElementContextIdentifier({ labelID: CUSTOM_LABEL_ID1 });

            testState.total = {
                [inboxContext]: 2,
                [archiveContext]: 1,
                [customLabelContext]: 1,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [inboxContext]: 1,
                [archiveContext]: 2,
                [customLabelContext]: 1,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = false;

            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const archiveContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ARCHIVE });
            const customLabelContext = generateElementContextIdentifier({ labelID: CUSTOM_LABEL_ID1 });
            const inboxUnreadOnContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                filter: { Unread: 1 },
            });
            const inboxUnreadOffContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.INBOX,
                filter: { Unread: 0 },
            });

            testState.total = {
                [inboxContext]: 2,
                [inboxUnreadOnContext]: 1,
                [inboxUnreadOffContext]: 1,
                [archiveContext]: 1,
                [customLabelContext]: 1,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [inboxContext]: 1,
                [inboxUnreadOnContext]: 0,
                [inboxUnreadOffContext]: 1,
                [archiveContext]: 2,
                [customLabelContext]: 1,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = false;

            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const almostAllMailContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            });
            const allMailContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.ALL_MAIL });
            const trashContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.TRASH });
            const starredContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.STARRED });
            const customLabelContext = generateElementContextIdentifier({ labelID: CUSTOM_LABEL_ID1 });
            const allMailUnreadOnContext = generateElementContextIdentifier({
                labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                filter: { Unread: 1 },
            });

            testState.total = {
                [inboxContext]: 2,
                [almostAllMailContext]: 2,
                [allMailContext]: 3,
                [allMailUnreadOnContext]: 1,
                [trashContext]: 1,
                [starredContext]: 1,
                [customLabelContext]: 1,
            };

            labelMessagesPending(testState, {
                type: 'mailbox/labelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [inboxContext]: 1,
                [almostAllMailContext]: 1,
                [allMailContext]: 3,
                [allMailUnreadOnContext]: 0,
                [trashContext]: 2,
                [starredContext]: 0,
                [customLabelContext]: 0,
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

            testState.params.filter = {};
            testState.params.sort = { sort: 'Time', desc: true };
            testState.params.conversationMode = false;

            const inboxContext = generateElementContextIdentifier({ labelID: MAILBOX_LABEL_IDS.INBOX });
            const customLabelContext = generateElementContextIdentifier({ labelID: CUSTOM_LABEL_ID1 });

            testState.total = {
                [inboxContext]: 2,
                [customLabelContext]: 1,
            };

            unlabelMessagesPending(testState, {
                type: 'mailbox/unlabelMessages',
                payload: undefined,
                meta: {
                    arg: {
                        messages: [message],
                        sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                        destinationLabelID: CUSTOM_LABEL_ID1,
                        labels: customLabels,
                        folders: customFolders,
                    },
                },
            });

            const updatedTotal = testState.total;
            expect(updatedTotal).toEqual({
                [inboxContext]: 2,
                [customLabelContext]: 0,
            });
        });
    });
});
