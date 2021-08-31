import { ReactNode, useState } from 'react';
import NotificationsContext from './notificationsContext';
import NotificationsChildrenContext from './childrenContext';
import { NotificationOptions } from './interfaces';
import createManager from './manager';
import { useInstance } from '../../hooks';

interface Props {
    children: ReactNode;
}

const NotificationsProvider = ({ children }: Props) => {
    const [notifications, setNotifications] = useState<NotificationOptions[]>([]);

    const manager = useInstance(() => {
        return createManager(setNotifications);
    });

    return (
        <NotificationsContext.Provider value={manager}>
            <NotificationsChildrenContext.Provider value={notifications}>
                {children}
            </NotificationsChildrenContext.Provider>
        </NotificationsContext.Provider>
    );
};

export default NotificationsProvider;
