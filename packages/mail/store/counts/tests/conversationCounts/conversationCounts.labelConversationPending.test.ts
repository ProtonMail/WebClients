import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { labelConversationsPending } from '@proton/mail/store/counts/conversationCountsReducers';
import {
    CUSTOM_LABEL_ID1,
    checkUpdatedCounters,
    createDefaultCounters,
    customFolders,
    customLabels,
} from '@proton/mail/store/counts/tests/counts.test.helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

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

    describe('Move to TRASH or SPAM', () => {
        it('should decrease STARRED counters when moving to TRASH', () => {
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
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 1, Total: 1 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 1 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 6 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.STARRED,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should decrease STARRED counters when moving to SPAM', () => {
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
                        ID: MAILBOX_LABEL_IDS.STARRED,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 1, Total: 1 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 1 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 6 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.STARRED,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should decrease CUSTOM_LABEL counter when moving to TRASH', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: CUSTOM_LABEL_ID1,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 1 });

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 6 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });
        });

        it('should decrease CUSTOM_LABEL counter when moving to SPAM', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: CUSTOM_LABEL_ID1,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 1 });

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 6 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });
        });

        it('should decrease ALMOST_ALL_MAIL counters when moving to TRASH', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 6 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should decrease ALMOST_ALL_MAIL counters when moving to SPAM', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 9 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 6 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 23 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });
    });

    describe('Move to STARRED or Custom label', () => {
        it('should increase STARRED counters and not update other counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const starCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 2, Total: 3 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.STARRED],
            });
        });

        it('should increase Custom label counters and not update other counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: CUSTOM_LABEL_ID1,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const customLabel = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabel).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 2, Total: 3 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [CUSTOM_LABEL_ID1],
            });
        });
    });

    describe('Move to category', () => {
        it('should increase new category counters, decrease old category counters and not update other counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const promotionCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            expect(promotionCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: 1, Total: 1 });

            const socialCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(socialCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 0, Total: 1 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
        });
    });

    describe('Default scenario', () => {
        it('should reduce source label counters and increase target label counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
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

        it('should not decrease STARRED counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
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

        it('should not decrease Custom label counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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
                        ID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
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

        it('should not decrease Category counters', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
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

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
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

        it('should increase ALMOST_ALL_MAIL counters when moving out from TRASH', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 2,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 11 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 4 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 25 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });
        });

        it('should increase ALMOST_ALL_MAIL counters when moving out from SPAM', () => {
            const conversation = {
                ID: 'conversationID',
                Labels: [
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
                ],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    conversations: [conversation],
                    sourceLabelID: MAILBOX_LABEL_IDS.SPAM,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 11 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 0, Total: 4 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 25 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            });
        });
    });
});
