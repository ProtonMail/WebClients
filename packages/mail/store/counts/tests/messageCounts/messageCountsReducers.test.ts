import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { markMessagesAsRead, markMessagesAsUnread } from '../../messageCountsReducers';

const makeState = (
    counters: { LabelID: string; Unread: number; Total: number }[]
): Draft<ModelState<LabelCount[]>> => ({
    value: counters,
    error: null,
    meta: { fetchedAt: 0, fetchedEphemeral: false },
});

const makeMessage = (LabelIDs: string[], Unread = 1) => ({ ID: 'msg', Unread, LabelIDs }) as MessageMetadata;

describe('messageCountsReducers', () => {
    it('should decrement unread count when marking messages as read', () => {
        const state = makeState([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: 'customLabel', Unread: 0, Total: 1 },
        ]);

        markMessagesAsRead(state, {
            type: 'mailbox/markMessagesAsRead',
            payload: {
                messages: [makeMessage([MAILBOX_LABEL_IDS.INBOX]), makeMessage([MAILBOX_LABEL_IDS.INBOX])],
                labelID: MAILBOX_LABEL_IDS.INBOX,
            },
        });

        expect(state.value).toEqual([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 2 },
            { LabelID: 'customLabel', Unread: 0, Total: 1 },
        ]);
    });

    it('should not decrement the category unread count when marking messages as read and not in inbox', () => {
        const state = makeState([
            { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 2, Total: 2 },
        ]);
        const messages = [
            makeMessage([MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
            makeMessage([MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
        ];

        markMessagesAsRead(state, {
            type: 'mailbox/markMessagesAsRead',
            payload: { messages, labelID: MAILBOX_LABEL_IDS.TRASH },
        });

        expect(state.value).toEqual([
            { LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 0, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 2, Total: 2 },
        ]);
    });

    it('should decrement the category unread count when marking messages as read', () => {
        const state = makeState([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 2, Total: 2 },
        ]);
        const messages = [
            makeMessage([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
            makeMessage([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
        ];

        markMessagesAsRead(state, {
            type: 'mailbox/markMessagesAsRead',
            payload: { messages, labelID: MAILBOX_LABEL_IDS.INBOX },
        });

        expect(state.value).toEqual([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 0, Total: 2 },
        ]);
    });

    it('should decrement the category unread count when marking messages as read in inbox and star', () => {
        const state = makeState([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 2, Total: 2 },
        ]);
        const messages = [
            makeMessage([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.STARRED, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
            makeMessage([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.STARRED, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
        ];

        markMessagesAsRead(state, {
            type: 'mailbox/markMessagesAsRead',
            payload: { messages, labelID: MAILBOX_LABEL_IDS.STARRED },
        });

        expect(state.value).toEqual([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 0, Total: 2 },
        ]);
    });

    it('should not decrement the category unread count when marking messages as read not in inbox and star', () => {
        const state = makeState([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 2, Total: 2 },
        ]);
        const messages = [
            makeMessage([MAILBOX_LABEL_IDS.STARRED, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
            makeMessage([MAILBOX_LABEL_IDS.STARRED, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS]),
        ];

        markMessagesAsRead(state, {
            type: 'mailbox/markMessagesAsRead',
            payload: { messages, labelID: MAILBOX_LABEL_IDS.STARRED },
        });

        expect(state.value).toEqual([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 0, Total: 2 },
            { LabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, Unread: 2, Total: 2 },
        ]);
    });

    it('should increment unread count when marking messages as unread', () => {
        const state = makeState([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: 'customLabel', Unread: 0, Total: 1 },
        ]);

        markMessagesAsUnread(state, {
            type: 'mailbox/markMessagesAsUnread',
            payload: { messages: [makeMessage(['customLabel'], 0)], labelID: 'customLabel' },
        });

        expect(state.value).toEqual([
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 2, Total: 2 },
            { LabelID: 'customLabel', Unread: 1, Total: 1 },
        ]);
    });
});
