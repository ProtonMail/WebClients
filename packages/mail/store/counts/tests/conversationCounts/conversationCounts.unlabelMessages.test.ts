import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { unlabelMessagesPending } from '@proton/mail/store/counts/conversationCountsReducers';
import {
    CUSTOM_LABEL_ID1,
    checkUpdatedCounters,
    createDefaultCounters,
    customLabels,
} from '@proton/mail/store/counts/tests/counts.test.helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

describe('conversation counts - unlabel messages', () => {
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

    it('should do nothing when trying to unlabel a folder', () => {
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

        unlabelMessagesPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message1],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                conversations: [conversation],
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [],
        });
    });

    it('should not decrease STARRED count when some conversation items are remaining in label', () => {
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

        unlabelMessagesPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message1],
                destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                conversations: [conversation],
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
        expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 2 });

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [MAILBOX_LABEL_IDS.STARRED],
        });
    });

    it('should decrease STARRED count when no conversation items are remaining in label', () => {
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
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ],
            NumMessages: 2,
            NumUnread: 1,
            NumAttachments: 1,
        } as Conversation;

        unlabelMessagesPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message1],
                destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                conversations: [conversation],
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
        expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 1 });

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [MAILBOX_LABEL_IDS.STARRED],
        });
    });

    it('should not decrease custom label count when some conversation items are remaining in label', () => {
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

        unlabelMessagesPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message1],
                destinationLabelID: CUSTOM_LABEL_ID1,
                conversations: [conversation],
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
        expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 2 });

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [CUSTOM_LABEL_ID1],
        });
    });

    it('should decrease custom label count when no conversation items are remaining in label', () => {
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
                    ID: CUSTOM_LABEL_ID1,
                    ContextNumMessages: 1,
                    ContextNumUnread: 1,
                    ContextNumAttachments: 1,
                },
            ],
            NumMessages: 2,
            NumUnread: 1,
            NumAttachments: 1,
        } as Conversation;

        unlabelMessagesPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message1],
                destinationLabelID: CUSTOM_LABEL_ID1,
                conversations: [conversation],
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
        expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 1 });

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [CUSTOM_LABEL_ID1],
        });
    });
});
