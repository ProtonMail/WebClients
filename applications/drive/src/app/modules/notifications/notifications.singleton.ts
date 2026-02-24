import type { NotificationsManager } from '@proton/components/containers/notifications/manager';

import { sendErrorReport } from '../../utils/errorHandling';

const noopManager: NotificationsManager = {
    setOffset: () => {},
    removeDuplicate: () => {},
    createNotification: (options) => {
        console.warn('[Drive] NotificationsManager not initialized', options);
        sendErrorReport(
            new Error('NotificationsManager not initialized', {
                cause: 'createNotification was called before it was initialized by NotificationsBridge',
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
