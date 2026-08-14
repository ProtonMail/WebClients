import {
    hasDismissedModelSwitchNotification,
    markModelSwitchNotificationDismissed,
} from './modelSwitchNotificationStorage';

describe('modelSwitchNotificationStorage', () => {
    const conversationId = '00000000-0000-4000-8000-000000000001';

    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns false when the notification has not been dismissed', () => {
        expect(hasDismissedModelSwitchNotification(conversationId)).toBe(false);
    });

    it('persists dismissal per conversation in sessionStorage', () => {
        markModelSwitchNotificationDismissed(conversationId);

        expect(hasDismissedModelSwitchNotification(conversationId)).toBe(true);
        expect(hasDismissedModelSwitchNotification('00000000-0000-4000-8000-000000000002')).toBe(false);
    });
});
