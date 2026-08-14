import {
    hasDismissedGuestNotification,
    markGuestNotificationDismissed,
} from './guestNotificationStorage';

describe('guestNotificationStorage', () => {
    const conversationId = '00000000-0000-4000-8000-000000000001';

    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns false when the notification has not been dismissed', () => {
        expect(hasDismissedGuestNotification(conversationId)).toBe(false);
    });

    it('persists dismissal per conversation in sessionStorage', () => {
        markGuestNotificationDismissed(conversationId);

        expect(hasDismissedGuestNotification(conversationId)).toBe(true);
        expect(hasDismissedGuestNotification('00000000-0000-4000-8000-000000000002')).toBe(false);
    });
});
