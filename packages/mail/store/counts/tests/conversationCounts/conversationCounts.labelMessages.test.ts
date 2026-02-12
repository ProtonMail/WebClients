import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { labelMessagesPending } from '@proton/mail/store/counts/conversationCountsReducers';
import {
    CUSTOM_LABEL_ID1,
    checkUpdatedCounters,
    createDefaultCounters,
    customFolders,
    customLabels,
} from '@proton/mail/store/counts/tests/counts.test.helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

describe('conversation counts - label messages', () => {
    let state: Draft<ModelState<LabelCount[]>>;

    beforeEach(() => {
        state = {
            value: createDefaultCounters(),
            error: null,
            meta: {
                fetchedAt: 0,
                fetchedEphemeral: false,
            },
        };
    });

    describe('Default scenario', () => {
        it('should reduce source label counters if no conversation items left in source label', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not change source label counters if some conversation items are left in source label', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ARCHIVE,
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
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 5, Total: 10 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should increase target label counters if no conversation items is in target label', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 3 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not change target label counters if some conversation items are in target label', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                ],
                NumMessages: 2,
                NumUnread: 2,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease STARRED counters', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 2,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 2,
                NumUnread: 2,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease Custom label counters', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                ],
                NumMessages: 2,
                NumUnread: 2,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease Category counters', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
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
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should increase ALMOST_ALL_MAIL counters when moving out from TRASH', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 11 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 5 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 25 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });
        });

        it('should increase ALMOST_ALL_MAIL counters when moving out from TRASH', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.SPAM,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 11 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 0, Total: 5 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 25 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });
        });
    });

    describe('Move to TRASH or SPAM', () => {
        it('should should decrease STARRED counters when moving to TRASH', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 6 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 1 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.STARRED,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
            });
        });

        it('should should decrease STARRED counters when moving to SPAM', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 6 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 1 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.STARRED,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
            });
        });

        it('should should decrease Custom label counters when moving to TRASH', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 6 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 1 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    CUSTOM_LABEL_ID1,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
            });
        });

        it('should should decrease Custom label counters when moving to SPAM', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: CUSTOM_LABEL_ID1,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 6 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 1 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    CUSTOM_LABEL_ID1,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
            });
        });

        it('should should decrease ALMOST_ALL_MAIL counters when moving to TRASH', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 6 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
            });
        });

        it('should should decrease ALMOST_ALL_MAIL counters when moving to SPAM', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 6 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                ],
            });
        });
    });

    describe('Move to STARRED or Custom label', () => {
        it('should increase STARRED counters and not update other counters', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 2, Total: 3 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.STARRED],
            });
        });

        it('should increase Custom label counters and not update other counters', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: CUSTOM_LABEL_ID1,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 2, Total: 3 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [CUSTOM_LABEL_ID1],
            });
        });
    });

    describe('Move to a category', () => {
        it('should increase new category counters, decrease old category counters and not update other counters', () => {
            const message1 = {
                ConversationID: 'conversationID',
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
                Unread: 1,
            } as Message;

            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                    {
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 1,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelMessagesPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    messages: [message1],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    conversations: [conversation],
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const socialCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(socialCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 0, Total: 1 });

            const promotionCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            expect(promotionCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: 1, Total: 1 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
        });
    });
});
