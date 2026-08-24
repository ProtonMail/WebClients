import type { ReactNode, Reducer } from 'react';
import { useEffect, useReducer, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';

import type { Notification, NotificationOffset } from '@proton/app-context/notifications/interfaces';
import createManager from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import useInstance from '@proton/hooks/useInstance';

import NotificationsChildrenContext from './childrenContext';

interface Props {
    children: ReactNode;
}

const offsetReducer = (oldState: NotificationOffset | undefined, newState: NotificationOffset | undefined) => {
    if (oldState === newState || isDeepEqual(oldState, newState)) {
        return oldState;
    }
    return newState;
};

const NotificationsProvider = ({ children }: Props) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [offset, setNotificationOffset] = useReducer<
        Reducer<NotificationOffset | undefined, NotificationOffset | undefined>
    >(offsetReducer, undefined);

    const manager = useInstance(() => {
        return createManager(setNotifications, setNotificationOffset);
    });

    useEffect(() => {
        return () => {
            manager.clearNotifications();
        };
    }, []);

    return (
        <NotificationsContext.Provider value={manager}>
            <NotificationsChildrenContext.Provider value={{ notifications, offset }}>
                {children}
            </NotificationsChildrenContext.Provider>
        </NotificationsContext.Provider>
    );
};

export default NotificationsProvider;
