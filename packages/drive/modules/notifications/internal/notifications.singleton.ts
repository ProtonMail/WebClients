import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import { traceError } from '@proton/shared/lib/helpers/sentry';

const noopManager: NotificationsManager = {
    setOffset: () => {},
    removeDuplicate: () => {},
    createNotification: (options) => {
        console.warn('[Drive] NotificationsManager not initialized', options);
        traceError(
            new Error('NotificationsManager not initialized', {
                cause: 'createNotification was called before useDrive() wired the singleton',
            })
        );
        return 0;
    },
    removeNotification: () => {},
    hideNotification: () => 0,
    clearNotifications: () => {},
};

let instance: NotificationsManager | null = null;

export const setNotificationsManager = (manager: NotificationsManager | null): void => {
    instance = manager;
};

export const getNotificationsManager = (): NotificationsManager => {
    return instance ?? noopManager;
};
