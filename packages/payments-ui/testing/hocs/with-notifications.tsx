import type { ComponentType, Reducer } from 'react';
import { useReducer, useState } from 'react';

import type { Notification, NotificationOffset } from '@proton/app-context/notifications/interfaces';
import createManager from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import useInstance from '@proton/hooks/useInstance';

const offsetReducer: Reducer<NotificationOffset | undefined, NotificationOffset | undefined> = (_, newState) =>
    newState;

export const withNotifications =
    () =>
    <T extends {}>(Component: ComponentType<T>) =>
        function NotificationsProviderHOC(props: T & JSX.IntrinsicAttributes) {
            const [, setNotifications] = useState<Notification[]>([]);
            const [, setNotificationOffset] = useReducer(offsetReducer, undefined);

            const manager = useInstance(() => createManager(setNotifications, setNotificationOffset));

            return (
                <NotificationsContext.Provider value={manager}>
                    <Component {...props} />
                </NotificationsContext.Provider>
            );
        };
