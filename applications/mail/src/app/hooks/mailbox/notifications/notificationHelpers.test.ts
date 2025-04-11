import type { History } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

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

    it('should fallback to ALL_MAIL when no matching label is found', () => {
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

        const notifier = [MAILBOX_LABEL_IDS.SENT];

        const result = prepareNotificationData({ message, history, mailSettings, notifier });

        expect(result.labelID).toBe(MAILBOX_LABEL_IDS.ALL_MAIL);
    });

    it('should handle non-conversation mode correctly', () => {
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
            ViewMode: VIEW_MODE.SINGLE,
        };

        const notifier = [MAILBOX_LABEL_IDS.INBOX];

        const result = prepareNotificationData({ message, history, mailSettings, notifier });

        expect(result.elementID).toBe('123');
        expect(result.messageID).toBeUndefined();
    });
});
