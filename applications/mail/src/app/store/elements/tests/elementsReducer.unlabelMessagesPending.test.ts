import type { Draft } from '@reduxjs/toolkit';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { ElementsState } from 'proton-mail/store/elements/elementsTypes';
import {
    CUSTOM_LABEL_ID1,
    MESSAGE_ID,
    customFolders,
    customLabels,
    expectMessagesLabelsSameArray,
    setupMessage,
} from 'proton-mail/store/elements/tests/elementsReducer.test.helpers';

import { unlabelMessagesPending } from '../elementsReducers';

describe('unlabelMessagesPending', () => {
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

    it('should do nothing when trying to unlabel a message', () => {
        const message = setupMessage({
            messageID: MESSAGE_ID,
            unreadState: 'unread',
            labelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
        });

        testState.elements = {
            [MESSAGE_ID]: message,
        };

        unlabelMessagesPending(testState, {
            type: 'mailbox/unlabelMessages',
            payload: undefined,
            meta: {
                arg: {
                    elements: [message],
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                },
            },
        });

        const updatedMessage = testState.elements[MESSAGE_ID] as Message;
        expect(updatedMessage.Unread).toEqual(1);
        expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        ]);
    });

    it('should remove STARRED when unlabeling a message', () => {
        const message = setupMessage({
            messageID: MESSAGE_ID,
            unreadState: 'unread',
            labelIDs: [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                MAILBOX_LABEL_IDS.STARRED,
            ],
        });

        testState.elements = {
            [MESSAGE_ID]: message,
        };

        unlabelMessagesPending(testState, {
            type: 'mailbox/unlabelMessages',
            payload: undefined,
            meta: {
                arg: {
                    elements: [message],
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                },
            },
        });

        const updatedMessage = testState.elements[MESSAGE_ID] as Message;
        expect(updatedMessage.Unread).toEqual(1);
        expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        ]);
    });

    it('should remove STARRED when unlabeling a message', () => {
        const message = setupMessage({
            messageID: MESSAGE_ID,
            unreadState: 'unread',
            labelIDs: [
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                CUSTOM_LABEL_ID1,
            ],
        });

        testState.elements = {
            [MESSAGE_ID]: message,
        };

        unlabelMessagesPending(testState, {
            type: 'mailbox/unlabelMessages',
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

        const updatedMessage = testState.elements[MESSAGE_ID] as Message;
        expect(updatedMessage.Unread).toEqual(1);
        expectMessagesLabelsSameArray(updatedMessage.LabelIDs, [
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
        ]);
    });
});
