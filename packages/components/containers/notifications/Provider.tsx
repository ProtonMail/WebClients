import { useRef, useState } from 'react';
import * as React from 'react';
import NotificationsContext from './notificationsContext';
import NotificationsContainer from './Container';
import createNotificationManager from './manager';
import { NotificationOptions } from './interfaces';

interface Props {
    children: React.ReactNode;
}

const NotificationsProvider = ({ children }: Props) => {
    const [notifications, setNotifications] = useState<NotificationOptions[]>([]);
    const managerRef = useRef<ReturnType<typeof createNotificationManager>>();

    if (!managerRef.current) {
        managerRef.current = createNotificationManager(setNotifications);
    }

    const manager = managerRef.current;

    const { hideNotification, removeNotification } = manager;

    return (
        <NotificationsContext.Provider value={manager}>
            {children}
            <NotificationsContainer
                notifications={notifications}
                removeNotification={removeNotification}
                hideNotification={hideNotification}
            />
        </NotificationsContext.Provider>
    );
};

export default NotificationsProvider;
