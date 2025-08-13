import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { labelConversationsPending } from '@proton/mail/store/counts/messageCountsReducers';
import {
    CUSTOM_LABEL_ID1,
    checkUpdatedCounters,
    createDefaultCounters,
    customFolders,
    customLabels,
} from '@proton/mail/store/counts/tests/counts.test.helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import type { Conversation, ConversationLabel } from 'proton-mail/models/conversation';

describe('message counts - label conversations', () => {
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
        it('should decrease ALMOST_ALL_MAIL counters when moving to TRASH, and mark messages as read', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

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

        it('should decrease STARRED counters when moving to TRASH, and mark messages as read', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 0 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });
        });

        it('should decrease Custom label counters when moving to TRASH, and mark messages as read', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 0 });

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

        it('should decrease ALMOST_ALL_MAIL counters when moving to SPAM', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

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

        it('should decrease STARRED counters when moving to SPAM', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 0 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });
        });

        it('should decrease Custom label counters when moving to SPAM', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 2, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 0 });

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
    });

    describe('Move to STARRED or custom label', () => {
        it('should increase STARRED counters and not update other counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 2, Total: 4 });

            checkUpdatedCounters({ updatedCounters, skippedLabelIDs: [MAILBOX_LABEL_IDS.STARRED] });
        });

        it('should increase Custom label counters and not update other counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: CUSTOM_LABEL_ID1,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 2, Total: 4 });

            checkUpdatedCounters({ updatedCounters, skippedLabelIDs: [CUSTOM_LABEL_ID1] });
        });
    });

    describe('Move to a category', () => {
        it('should increase new category counters, decrease old category counters and not update other counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const socialCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(socialCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 0, Total: 0 });

            const promotionsCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            expect(promotionsCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
        });

        it('should move missing messages in the category', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                        ContextNumMessages: 1,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const socialCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(socialCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 1, Total: 3 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
            });
        });
    });

    describe('received, sent and drafts messages are moved correctly', () => {
        it('should move received messages in INBOX and drafts messages in DRAFTS when moving a conversation to INBOX', () => {
            const conversation1 = {
                ID: 'conversation1',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 5,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 5,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                NumMessages: 5,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            // Received messages are moved to INBOX
            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 12 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 0 });

            const sentCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SENT);
            expect(sentCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 1, Total: 4 });

            const draftsCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.DRAFTS);
            expect(draftsCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.DRAFTS, Unread: 1, Total: 3 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 29 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.SENT,
                    MAILBOX_LABEL_IDS.DRAFTS,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should move received messages in INBOX and drafts messages in DRAFTS when moving a conversation to SENT', () => {
            const conversation1 = {
                ID: 'conversation1',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 5,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 5,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                NumMessages: 5,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                    targetLabelID: MAILBOX_LABEL_IDS.SENT,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            // Received messages are moved to INBOX
            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 12 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 0 });

            const sentCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SENT);
            expect(sentCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 1, Total: 4 });

            const draftsCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.DRAFTS);
            expect(draftsCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.DRAFTS, Unread: 1, Total: 3 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 29 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.SENT,
                    MAILBOX_LABEL_IDS.DRAFTS,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should move received messages in INBOX and drafts messages in DRAFTS when moving a conversation to DRAFTS', () => {
            const conversation1 = {
                ID: 'conversation1',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.TRASH,
                        ContextNumMessages: 5,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                    {
                        ID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 5,
                        ContextNumUnread: 1,
                        ContextNumAttachments: 1,
                    },
                ] as ConversationLabel[],
                NumMessages: 5,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.TRASH,
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            // Received messages are moved to INBOX
            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 6, Total: 12 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 0 });

            const sentCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SENT);
            expect(sentCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 1, Total: 4 });

            const draftsCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.DRAFTS);
            expect(draftsCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.DRAFTS, Unread: 1, Total: 3 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 11, Total: 29 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.SENT,
                    MAILBOX_LABEL_IDS.DRAFTS,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });
    });

    describe('Default scenario', () => {
        it('should increase new folder counters, decrease old folder counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease STARRED counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                    },
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.STARRED],
            });
        });

        it('should not decrease Custom label counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                    },
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE, CUSTOM_LABEL_ID1],
            });
        });

        it('should not decrease Category counters', () => {
            const conversation1 = {
                ID: 'conversation1',
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
                    },
                ] as ConversationLabel[],
                NumMessages: 2,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            const categoryCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(categoryCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            });
        });

        it('should increase ALMOST_ALL_MAIL counters when moving out from TRASH', () => {
            const conversation1 = {
                ID: 'conversation1',
                Labels: [
                    {
                        ID: MAILBOX_LABEL_IDS.INBOX,
                        ContextNumMessages: 2,
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
                        ContextNumMessages: 3,
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
                        ContextNumMessages: 3,
                        ContextNumUnread: 1,
                    },
                ] as ConversationLabel[],
                NumMessages: 3,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 4 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 5 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 10, Total: 25 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should increase ALMOST_ALL_MAIL counters when moving out from SPAM', () => {
            const conversation1 = {
                ID: 'conversation1',
                Labels: [
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
                        ID: MAILBOX_LABEL_IDS.ALL_MAIL,
                        ContextNumMessages: 3,
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
                        ContextNumMessages: 3,
                        ContextNumUnread: 1,
                    },
                ] as ConversationLabel[],
                NumMessages: 3,
                NumUnread: 1,
                NumAttachments: 1,
            } as Conversation;

            labelConversationsPending(state, {
                type: 'mailbox/labelConversationPending',
                payload: {
                    conversations: [conversation1],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 1, Total: 4 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 5 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 10, Total: 25 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ARCHIVE,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });
    });
});
