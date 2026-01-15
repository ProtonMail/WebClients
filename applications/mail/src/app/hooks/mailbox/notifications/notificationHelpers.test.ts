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

    describe('Categories redirection tests', () => {
        const MOCK_MESSAGE_WITH_CATEGORY = {
            ...MOCK_MESSAGE,
            LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
        };

        it('should replace inbox with Newsletter category', () => {
            const result = prepareNotificationData({
                message: MOCK_MESSAGE_WITH_CATEGORY,
                history: MOCK_HISTORY,
                mailSettings: MOCK_MAIL_SETTINGS,
                notifier: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                categoryViewAccess: true,
            });

            expect(result.location.pathname).toContain('/newsletters');
            expect(result.labelID).toBe(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS);
        });

        it('should use all-mails if the message has no categories', () => {
            const result = prepareNotificationData({
                message: MOCK_MESSAGE,
                history: MOCK_HISTORY,
                mailSettings: MOCK_MAIL_SETTINGS,
                notifier: [MAILBOX_LABEL_IDS.INBOX],
                categoryViewAccess: true,
            });

            expect(result.location.pathname).toContain('/all-mail');
            expect(result.labelID).toBe(MAILBOX_LABEL_IDS.ALL_MAIL);
        });

        it('should use the all-mail if the category is not in notifier', () => {
            const result = prepareNotificationData({
                message: MOCK_MESSAGE_WITH_CATEGORY,
                history: MOCK_HISTORY,
                mailSettings: MOCK_MAIL_SETTINGS,
                notifier: [MAILBOX_LABEL_IDS.INBOX],
                categoryViewAccess: true,
            });

            expect(result.location.pathname).toContain('/all-mail');
            expect(result.labelID).toBe(MAILBOX_LABEL_IDS.ALL_MAIL);
        });

        it('should keep the custom folder labelID', () => {
            const result = prepareNotificationData({
                message: {
                    ...MOCK_MESSAGE_WITH_CATEGORY,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, 'custom-folder'],
                },
                history: MOCK_HISTORY,
                mailSettings: MOCK_MAIL_SETTINGS,
                notifier: [MAILBOX_LABEL_IDS.INBOX, 'custom-folder'],
                categoryViewAccess: true,
            });

            expect(result.location.pathname).toContain('/custom-folder');
            expect(result.labelID).toBe('custom-folder');
        });

        it('should fallback to inbox if the message has a category but disabled the category view', () => {
            const result = prepareNotificationData({
                message: {
                    ...MOCK_MESSAGE_WITH_CATEGORY,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                },
                history: MOCK_HISTORY,
                mailSettings: MOCK_MAIL_SETTINGS,
                notifier: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                categoryViewAccess: false,
            });

            expect(result.location.pathname).toContain('/inbox');
            expect(result.labelID).toBe(MAILBOX_LABEL_IDS.INBOX);
        });
    });
});
