import type { History } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { prepareNotificationData } from './notificationHelpers';

const MOCK_MESSAGE = {
    Subject: 'Test Subject',
    Sender: {
        Name: 'John Doe',
        Address: 'john.doe@example.com',
    },
    ID: '123',
    ConversationID: '456',
    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
    Body: '',
    Header: '',
    ParsedHeaders: {},
    Attachments: [],
} as unknown as Message;

const MOCK_HISTORY = {
    location: {
        pathname: '/',
        search: '',
        hash: '',
    },
} as History;

const MOCK_MAIL_SETTINGS = {
    labelID: MAILBOX_LABEL_IDS.INBOX,
    ViewMode: VIEW_MODE.GROUP,
} as unknown as MailSettings;

describe('prepareNotificationData', () => {
    it('should prepare notification data for conversation view with matching label', () => {
        const result = prepareNotificationData({
            message: MOCK_MESSAGE,
            history: MOCK_HISTORY,
            mailSettings: MOCK_MAIL_SETTINGS,
            notifier: [MAILBOX_LABEL_IDS.INBOX],
            categoryViewAccess: false,
        });

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

    it('should fallback to ALL_MAIL when message label does not match notifier labels', () => {
        const result = prepareNotificationData({
            message: MOCK_MESSAGE,
            history: MOCK_HISTORY,
            mailSettings: MOCK_MAIL_SETTINGS,
            notifier: [MAILBOX_LABEL_IDS.SENT],
            categoryViewAccess: false,
        });

        expect(result.labelID).toBe(MAILBOX_LABEL_IDS.ALL_MAIL);
    });

    it('should prepare notification data for single message view when conversation mode is disabled', () => {
        const result = prepareNotificationData({
            message: MOCK_MESSAGE,
            history: MOCK_HISTORY,
            mailSettings: { ...MOCK_MAIL_SETTINGS, ViewMode: VIEW_MODE.SINGLE },
            notifier: [MAILBOX_LABEL_IDS.INBOX],
            categoryViewAccess: false,
        });

        expect(result.elementID).toBe('123');
        expect(result.messageID).toBeUndefined();
    });
});
