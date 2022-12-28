import { ReactNode, Reducer, useEffect, useReducer, useState } from 'react';

import useInstance from '@proton/hooks/useInstance';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import NotificationsChildrenContext from './childrenContext';
import { NotificationOffset, NotificationOptions } from './interfaces';
import createManager from './manager';
import NotificationsContext from './notificationsContext';

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
    const [notifications, setNotifications] = useState<NotificationOptions[]>([]);
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
