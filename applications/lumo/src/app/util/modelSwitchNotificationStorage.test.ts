import {
    hasDismissedModelSwitchNotification,
    markModelSwitchNotificationDismissed,
} from './modelSwitchNotificationStorage';

describe('modelSwitchNotificationStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns false when the notification has not been dismissed', () => {
        expect(hasDismissedModelSwitchNotification()).toBe(false);
    });

    it('persists dismissal for the browser session', () => {
        markModelSwitchNotificationDismissed();

        expect(hasDismissedModelSwitchNotification()).toBe(true);
    });

    it('honors dismissals stored by the former per-conversation implementation', () => {
        sessionStorage.setItem(
            'lumo-model-switch-notification-00000000-0000-4000-8000-000000000001',
            '1'
        );

        expect(hasDismissedModelSwitchNotification()).toBe(true);
    });
});
