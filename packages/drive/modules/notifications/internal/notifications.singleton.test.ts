import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import { traceError } from '@proton/shared/lib/helpers/sentry';

import { getNotificationsManager, setNotificationsManager } from './notifications.singleton';

vi.mock('@proton/shared/lib/helpers/sentry', () => ({
    traceError: vi.fn(),
}));

const makeMockManager = (): NotificationsManager => ({
    createNotification: vi.fn().mockReturnValue(1),
    removeNotification: vi.fn(),
    hideNotification: vi.fn(),
    clearNotifications: vi.fn(),
    setOffset: vi.fn(),
    removeDuplicate: vi.fn(),
});

describe('notifications singleton', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        setNotificationsManager(null);
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe('when not initialized', () => {
        it('does not throw when calling createNotification', () => {
            expect(() => getNotificationsManager().createNotification({ text: 'test' })).not.toThrow();
        });

        it('logs a warning when calling createNotification', () => {
            getNotificationsManager().createNotification({ text: 'test' });
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('NotificationsManager not initialized'),
                expect.objectContaining({ text: 'test' })
            );
        });

        it('reports an error when calling createNotification', () => {
            getNotificationsManager().createNotification({ text: 'test' });
            expect(traceError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'NotificationsManager not initialized',
                })
            );
        });

        it('does not throw when calling other no-op methods', () => {
            const manager = getNotificationsManager();
            expect(() => manager.removeNotification(1)).not.toThrow();
            expect(() => manager.hideNotification(1)).not.toThrow();
            expect(() => manager.clearNotifications()).not.toThrow();
            expect(() => manager.setOffset(undefined)).not.toThrow();
            expect(() => manager.removeDuplicate(1)).not.toThrow();
        });
    });

    describe('when initialized', () => {
        it('forwards createNotification to the real manager', () => {
            const mock = makeMockManager();
            setNotificationsManager(mock);

            getNotificationsManager().createNotification({ text: 'hello' });

            expect(mock.createNotification).toHaveBeenCalledWith({ text: 'hello' });
        });

        it('falls back to no-op after setNotificationsManager(null)', () => {
            const mock = makeMockManager();
            setNotificationsManager(mock);
            setNotificationsManager(null);

            expect(() => getNotificationsManager().createNotification({ text: 'after reset' })).not.toThrow();
            expect(mock.createNotification).not.toHaveBeenCalled();
        });
    });
});
