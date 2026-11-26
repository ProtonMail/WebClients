import { projectPrompt } from './definitions';

const DAY = 24 * 3_600;

describe('projectPrompt', () => {
    const online = { offlineComponents: false, online: true };

    test('projects the full descriptor for an eligible prompt', () => {
        expect(projectPrompt('offline-banner', undefined, online, 1000)).toEqual({
            id: 'offline-banner',
            title: 'Enable offline mode',
            body: 'Access your Pass data if you lose internet connectivity or if Proton servers are unreachable.',
            primary: { action: 'enable-offline', label: 'Enable offline mode' },
        });
    });

    test('carries the dismiss toast only when defined', () => {
        const onpage = projectPrompt('offline-onpage', undefined, online, 1000);
        expect(onpage?.dismissToast).toBeDefined();

        const banner = projectPrompt('offline-banner', undefined, online, 1000);
        expect('dismissToast' in banner!).toBe(false);
    });

    test('returns null when the id is unknown', () => {
        expect(projectPrompt('unknown' as any, undefined, online, 1000)).toBeNull();
    });

    test('returns null when ineligible on offline components', () => {
        expect(projectPrompt('offline-banner', undefined, { offlineComponents: true, online: true }, 1000)).toBeNull();
    });

    test('returns null when offline (SRP setup requires connectivity)', () => {
        expect(projectPrompt('offline-banner', undefined, { offlineComponents: false, online: false }, 1000)).toBeNull();
    });

    test('returns null while the cadence snooze is running', () => {
        const dismissal = { count: 1, lastDismissedAt: 1000 };
        expect(projectPrompt('offline-banner', dismissal, online, 1000 + 2 * 7 * DAY)).toBeNull();
    });

    test('re-prompts once the cadence snooze elapses', () => {
        const dismissal = { count: 1, lastDismissedAt: 1000 };
        expect(projectPrompt('offline-banner', dismissal, online, 1000 + 2 * 7 * DAY + 1)).not.toBeNull();
    });

    test('stops prompting once the cadence is exhausted', () => {
        const dismissal = { count: 2, lastDismissedAt: 1000 };
        expect(projectPrompt('offline-banner', dismissal, online, Number.MAX_SAFE_INTEGER)).toBeNull();
    });
});
