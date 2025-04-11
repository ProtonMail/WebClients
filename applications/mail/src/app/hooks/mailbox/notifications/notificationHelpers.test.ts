import type { History } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { prepareNotificationData } from './notificationHelpers';

describe('prepareNotificationData', () => {
    it('should prepare notification data to open the correct conversation and message', () => {
        const message = {
            Subject: 'Test Subject',
            Sender: {
                Name: 'John Doe',
                Address: 'john.doe@example.com',
            },
            ID: '123',
            ConversationID: '456',
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
        } as Message;

        const history = {
            location: {
                pathname: '/',
                search: '',
                hash: '',
            },
        } as History;

        const mailSettings = {
            labelID: MAILBOX_LABEL_IDS.INBOX,
        };

        const notifier = [MAILBOX_LABEL_IDS.INBOX];

        const result = prepareNotificationData({ message, history, mailSettings, notifier });

        expect(result).toEqual({
            title: 'New email received',
            body: 'From: John Doe - Test Subject',
            location: {
                pathname: '/inbox/456/123',
                search: '',
                hash: '',
            },
            ID: '123',
            labelID: MAILBOX_LABEL_IDS.INBOX,
            elementID: '456',
            messageID: '123',
        });
    });
});
