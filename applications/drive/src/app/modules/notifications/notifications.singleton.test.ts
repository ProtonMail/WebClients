import type { NotificationsManager } from '@proton/components/containers/notifications/manager';

import { sendErrorReport } from '../../utils/errorHandling';
import { getNotificationsManager, setNotificationsManager } from './notifications.singleton';

jest.mock('../../utils/errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

const makeMockManager = (): NotificationsManager => ({
    createNotification: jest.fn().mockReturnValue(1),
    removeNotification: jest.fn(),
    hideNotification: jest.fn(),
    clearNotifications: jest.fn(),
    setOffset: jest.fn(),
    removeDuplicate: jest.fn(),
});

describe('notifications singleton', () => {
    beforeEach(() => {
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        setNotificationsManager(null);
        jest.restoreAllMocks();
        jest.clearAllMocks();
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
            expect(sendErrorReport).toHaveBeenCalledWith(
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
