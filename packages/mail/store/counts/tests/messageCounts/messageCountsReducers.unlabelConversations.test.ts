import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { unlabelConversationsPending } from '@proton/mail/store/counts/messageCountsReducers';
import {
    CUSTOM_LABEL_ID1,
    checkUpdatedCounters,
    createDefaultCounters,
    customLabels,
} from '@proton/mail/store/counts/tests/counts.test.helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import type { Conversation } from 'proton-mail/models/conversation';

describe('message counts - unlabel conversations', () => {
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

        unlabelConversationsPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                conversations: [conversation],
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [],
        });
    });

    it('should decrease STARRED count when no conversation items are remaining in label', () => {
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

        unlabelConversationsPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                conversations: [conversation],
                destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
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

    it('should decrease custom label count', () => {
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

        unlabelConversationsPending(state, {
            type: 'mailbox/labelMessages',
            payload: {
                conversations: [conversation],
                destinationLabelID: CUSTOM_LABEL_ID1,
                labels: customLabels,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
        expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 0, Total: 0 });

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [CUSTOM_LABEL_ID1],
        });
    });
});
