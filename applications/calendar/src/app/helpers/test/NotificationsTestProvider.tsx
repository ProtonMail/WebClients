import React, { useRef, useState } from 'react';

import NotificationsContainer from '@proton/components/containers/notifications/Container';
import type { Notification } from '@proton/components/containers/notifications/interfaces';
import createNotificationManager from '@proton/components/containers/notifications/manager';
import NotificationsContext from '@proton/components/containers/notifications/notificationsContext';
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
