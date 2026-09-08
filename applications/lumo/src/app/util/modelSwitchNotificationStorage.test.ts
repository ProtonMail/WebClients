import {
    hasDismissedModelSwitchNotification,
    markModelSwitchNotificationDismissed,
} from './modelSwitchNotificationStorage';

describe('modelSwitchNotificationStorage', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('returns false when the notification has not been dismissed', () => {
        expect(hasDismissedModelSwitchNotification('lumo-lite')).toBe(false);
    });

    it('persists dismissal independently for Lite and Apertus', () => {
        markModelSwitchNotificationDismissed('lumo-lite');

        expect(hasDismissedModelSwitchNotification('lumo-lite')).toBe(true);
        expect(hasDismissedModelSwitchNotification('apertus-15')).toBe(false);
    });
});
