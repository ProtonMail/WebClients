import type { AnyAction } from 'redux';

import type { CreateNotificationOptions, NotificationType } from '@proton/components/index';
import type { ExtensionEndpoint } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export type Notification = CreateNotificationOptions & { receiver?: ExtensionEndpoint };
export type WithNotification<T = AnyAction> = T & { meta: { notification: Notification } };
export type NotificationOptions = Notification &
    ({ type: 'error'; error: unknown } | { type: Exclude<NotificationType, 'error'> });

/* type guard utility */
export const isActionWithNotification = <T extends AnyAction>(action?: T): action is WithNotification<T> =>
    (action as any)?.meta?.notification !== undefined;

const parseNotification = (notification: NotificationOptions): Notification => {
    switch (notification.type) {
        case 'success':
        case 'info':
        case 'warning':
            return notification;
        case 'error': {
            const serializedNotification: Notification = {
                ...notification,
                text:
                    notification.error instanceof Error
                        ? `${notification.text}: ${
                              getApiErrorMessage(notification.error) ?? notification.error?.message ?? ''
                          }`
                        : notification.text,
            };

            return serializedNotification;
        }
    }
};

const withNotification =
    (options: NotificationOptions) =>
    <T extends object>(action: T): WithNotification<T> => {
        const notification = parseNotification(options);

        return merge(action, { meta: { notification } });
    };

export default withNotification;
