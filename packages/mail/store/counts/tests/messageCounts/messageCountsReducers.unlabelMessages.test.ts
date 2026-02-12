import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { unlabelMessages } from '@proton/mail/store/counts/messageCountsReducers';
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
        const message = {
            ID: 'messageID',
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
        } as Message;

        unlabelMessages(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message],
                sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                labels: customLabels,
                folders: customFolders,
            },
        });

        const updatedCounters = state.value as LabelCount[];

        checkUpdatedCounters({
            updatedCounters,
            skippedLabelIDs: [],
        });
    });

    it('should decrease STARRED count when no conversation items are remaining in label', () => {
        const message = {
            ID: 'messageID',
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.STARRED],
            Unread: 1,
        } as Message;

        unlabelMessages(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message],
                sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                labels: customLabels,
                folders: customFolders,
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
        const message = {
            ID: 'messageID',
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, CUSTOM_LABEL_ID1],
            Unread: 1,
        } as Message;

        unlabelMessages(state, {
            type: 'mailbox/labelMessages',
            payload: {
                messages: [message],
                sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                destinationLabelID: CUSTOM_LABEL_ID1,
                labels: customLabels,
                folders: customFolders,
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
