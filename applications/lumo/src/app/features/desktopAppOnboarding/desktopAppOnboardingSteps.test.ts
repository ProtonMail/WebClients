import { getDesktopAppOnboardingSteps, needsNotificationStep } from './desktopAppOnboardingSteps';

describe('needsNotificationStep', () => {
    it('asks when permission is not granted yet', () => {
        expect(needsNotificationStep({ hasNotificationsApi: true, permission: 'not_determined' })).toBe(true);
        expect(needsNotificationStep({ hasNotificationsApi: true, permission: 'denied' })).toBe(true);
    });

    it('skips when already granted, unknown, or the app has no notifications bridge', () => {
        expect(needsNotificationStep({ hasNotificationsApi: true, permission: 'granted' })).toBe(false);
        expect(needsNotificationStep({ hasNotificationsApi: true, permission: undefined })).toBe(false);
        expect(needsNotificationStep({ hasNotificationsApi: false, permission: 'not_determined' })).toBe(false);
    });
});

describe('getDesktopAppOnboardingSteps', () => {
    it('follows the Figma order', () => {
        expect(getDesktopAppOnboardingSteps({ includeNotifications: true })).toEqual([
            'welcome',
            'connectors',
            'skills',
            'schedules',
            'notifications',
            'final',
        ]);
    });

    it('drops the notifications step when not needed', () => {
        expect(getDesktopAppOnboardingSteps({ includeNotifications: false })).toEqual([
            'welcome',
            'connectors',
            'skills',
            'schedules',
            'final',
        ]);
    });
});
