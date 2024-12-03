import noop from '@proton/utils/noop';

import type { ElectronNotification } from '../desktop/desktopTypes';
import { invokeInboxDesktopIPC } from '../desktop/ipcHelpers';

export enum Status {
    DENIED = 'denied',
    DEFAULT = 'default',
    GRANTED = 'granted',
}

let notifications: Notification[] = [];

export const hasNotificationSupport = (): boolean => 'Notification' in window;
export const hasPermission = (): boolean => Notification.permission === Status.GRANTED;
export const hasDenied = (): boolean => Notification.permission === Status.DENIED;

const addNotification = (notification: Notification) => {
    notifications.push(notification);
};

const removeNotification = (notification: Notification) => {
    notifications = notifications.filter((n) => n !== notification);
};

const setupNotificationHandlers = (notification: Notification, onClick?: () => void) => {
    notification.onclose = () => removeNotification(notification);
    notification.onclick = () => {
        onClick?.();
        notification.close();
    };
};

export const getStatus = (): Status => {
    if (!hasNotificationSupport()) {
        return Status.DEFAULT;
    }

    if (hasPermission()) {
        return Status.GRANTED;
    }

    if (hasDenied()) {
        return Status.DENIED;
    }

    return Status.DEFAULT;
};

export const isEnabled = (): boolean => {
    if (hasNotificationSupport()) {
        return hasPermission();
    }
    return false;
};

export const clear = () => {
    notifications.forEach((notification) => notification.close());
    notifications = [];
};

export const request = async (onGranted: () => void = noop, onDenied: () => void = noop) => {
    if (!hasNotificationSupport() || hasDenied()) {
        onDenied();
        return;
    }

    if (hasPermission()) {
        onGranted();
        return;
    }

    const permission = await Notification.requestPermission();

    if (permission === Status.GRANTED) {
        onGranted();
    } else {
        onDenied();
    }
};

const createWebNotification = (title: string, options?: NotificationOptions, onClick?: () => void) => {
    if (!isEnabled()) {
        return;
    }

    const notification = new Notification(title, options);

    addNotification(notification);

    setupNotificationHandlers(notification, onClick);

    return notification;
};

export const createElectronNotification = (payload: ElectronNotification) => {
    return invokeInboxDesktopIPC({ type: 'showNotification', payload });
};

interface NotificationParams extends NotificationOptions {
    onClick?: () => void;
}

export const create = async (title = '', params: NotificationParams = {}) => {
    await request();
    if (!isEnabled()) {
        return; // Exit if permission wasn't granted
    }

    return createWebNotification(title, params, params.onClick);
};
