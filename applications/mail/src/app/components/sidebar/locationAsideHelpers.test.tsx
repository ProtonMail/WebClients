import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS_LABELS } from '@proton/shared/lib/mail/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { getUnreadCount, getUnreadTitle } from './locationAsideHelpers';

// Mock the helpers/text functions
jest.mock('proton-mail/helpers/text', () => ({
    getNUnreadConversationsText: (count: number) => `${count} unread conversations`,
    getNUnreadMessagesText: (count: number) => `${count} unread messages`,
}));

describe('locationAsideHelpers', () => {
    describe('getUnreadTitle', () => {
        const mockMailSettings = {
            ViewMode: VIEW_MODE.GROUP,
        } as MailSettings;

        it('should return scheduled message text when shouldDisplayTotal is true with singular form', () => {
            const result = getUnreadTitle(true, 1, mockMailSettings, MAILBOX_LABEL_IDS.INBOX);
            expect(result).toBe('1 scheduled message');
        });

        it('should return scheduled message text when shouldDisplayTotal is true with plural form', () => {
            const result = getUnreadTitle(true, 5, mockMailSettings, MAILBOX_LABEL_IDS.INBOX);
            expect(result).toBe('5 scheduled messages');
        });

        it('should return unread conversations text when shouldDisplayTotal is false and ViewMode is GROUP', () => {
            const result = getUnreadTitle(false, 5, mockMailSettings, MAILBOX_LABEL_IDS.INBOX);
            expect(result).toBe('5 unread conversations');
        });

        it('should return unread messages text when shouldDisplayTotal is false and ViewMode is not GROUP', () => {
            const result = getUnreadTitle(
                false,
                5,
                { ViewMode: VIEW_MODE.SINGLE } as MailSettings,
                MAILBOX_LABEL_IDS.INBOX
            );
            expect(result).toBe('5 unread messages');
        });

        it('should return unread newsletter subscriptions when in the newsletter subscriptions view', () => {
            const result = getUnreadTitle(false, 5, mockMailSettings, CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS);
            expect(result).toBe('5 newsletter subscriptions');
        });
    });

    describe('getUnreadCount', () => {
        it('should format the count normally for regular labels', () => {
            expect(getUnreadCount('INBOX', 5)).toBe(5);
            expect(getUnreadCount('TRASH', 100)).toBe(100);
        });

        it('should show 9999+ when count exceeds UNREAD_LIMIT for regular labels', () => {
            expect(getUnreadCount('INBOX', 10000)).toBe('9999+');
        });

        it('should show the exact count for newsletter subscriptions when below limit', () => {
            expect(getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, 5)).toBe(5);
            expect(getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, 99)).toBe(99);
            expect(getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, 150)).toBe(150);
        });

        it('should show 99+ when count exceeds MAIL_SUBSCRIPTION_LIMIT for newsletter subscriptions', () => {
            expect(getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, 1000)).toBe('999+');
            expect(getUnreadCount(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS, 1500)).toBe('999+');
        });
    });
});
