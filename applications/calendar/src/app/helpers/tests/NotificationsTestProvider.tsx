import React, { useRef, useState } from 'react';

import type { Notification } from '@proton/app-context/notifications/interfaces';
import createNotificationManager from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import NotificationsContainer from '@proton/components/containers/notifications/Container';
import noop from '@proton/utils/noop';

interface Props {
    children: React.ReactNode;
}

const NotificationsTestProvider = ({ children }: Props) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const managerRef = useRef<ReturnType<typeof createNotificationManager>>();
    if (!managerRef.current) {
        managerRef.current = createNotificationManager(setNotifications as any, noop);
    }
    const manager = managerRef.current;
    const { hideNotification, removeNotification, removeDuplicate } = manager;

    return (
        <NotificationsContext.Provider value={manager}>
            {children}
            <NotificationsContainer
                notifications={notifications}
                removeNotification={removeNotification}
                removeDuplicate={removeDuplicate}
                hideNotification={hideNotification}
            />
        </NotificationsContext.Provider>
    );
};

export default NotificationsTestProvider;
