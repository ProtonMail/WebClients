import type { Action } from 'redux';

import type { CreateNotificationOptions, NotificationType } from '@proton/components';
import type { ClientEndpoint } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';

import { type WithMeta, withMetaFactory } from './meta';

export type Notification = CreateNotificationOptions & {
    /** Specifies the client endpoint for filtering notifications.
     * Relevant only within the extension context. */
    endpoint?: ClientEndpoint;
    /** Indicates whether the notification will display a spinner
     * and persist indefinitely. */
    loading?: boolean;
    /** Determines if the notification should be displayed
     * when the client is offline. */
    offline?: boolean;
    errorMessage?: string;
};

export type NotificationMeta = { notification: Notification };
export type NotificationOptions = Notification &
    ({ type: 'error'; error: unknown } | { type: Exclude<NotificationType, 'error'> });

export type WithNotification<A = Action> = WithMeta<NotificationMeta, A>;

const parseNotification = (notification: NotificationOptions): Notification => {
    switch (notification.type) {
        case 'success':
        case 'info':
        case 'warning':
            return notification;
        case 'error': {
            const errorMessage =
                notification.error instanceof Error
                    ? getErrorMessage(notification.error, notification.error.message)
                    : undefined;

            const serializedNotification: Notification = {
                ...notification,
                text: notification.text,
                errorMessage,
                /** Default to offline notifications if not explicitly specified. */
                offline: notification.offline ?? true,
            };

            return serializedNotification;
        }
    }
};

export const withNotification = (options: NotificationOptions) =>
    withMetaFactory<NotificationMeta>({ notification: parseNotification(options) });

export const isActionWithNotification = <T extends Action>(action?: T): action is WithNotification<T> =>
    (action as any)?.meta?.notification !== undefined;
