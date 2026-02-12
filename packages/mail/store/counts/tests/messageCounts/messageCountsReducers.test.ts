import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { markMessagesAsRead, markMessagesAsUnread } from '../../messageCountsReducers';

describe('messageCountsReducers', () => {
    let state: Draft<ModelState<LabelCount[]>>;

    beforeEach(() => {
        state = {
            value: [
                {
                    LabelID: 'label1',
                    Unread: 2,
                    Total: 2,
                },
                {
                    LabelID: 'label2',
                    Unread: 0,
                    Total: 1,
                },
            ],
            error: null,
            meta: {
                fetchedAt: 0,
                fetchedEphemeral: false,
            },
        };
    });

    it('should decrement unread count when marking messages as read', () => {
        const message1 = {
            ID: 'message1',
            Unread: 1,
            LabelIDs: ['label1'],
        } as MessageMetadata;

        const message2 = {
            ID: 'message2',
            Unread: 1,
            LabelIDs: ['label1'],
        } as MessageMetadata;

        markMessagesAsRead(state, {
            type: 'mailbox/markMessagesAsRead',
            payload: { messages: [message1, message2], labelID: 'label1' },
        });

        expect(state.value).toEqual([
            { LabelID: 'label1', Unread: 0, Total: 2 },
            { LabelID: 'label2', Unread: 0, Total: 1 },
        ]);
    });

    it('should increment unread count when marking messages as unread', () => {
        const message1 = {
            ID: 'message1',
            Unread: 0,
            LabelIDs: ['label2'],
        } as MessageMetadata;

        markMessagesAsUnread(state, {
            type: 'mailbox/markMessagesAsUnread',
            payload: { messages: [message1], labelID: 'label2' },
        });

        expect(state.value).toEqual([
            { LabelID: 'label1', Unread: 2, Total: 2 },
            { LabelID: 'label2', Unread: 1, Total: 1 },
        ]);
    });
});
