import React, { useRef } from 'react';
import createNotificationManager from '@proton/components/containers/notifications/manager';
import NotificationsContext from '@proton/components/containers/notifications/notificationsContext';
import NotificationsContainer from '@proton/components/containers/notifications/Container';
import { NotificationOptions } from '@proton/components/containers/notifications/interfaces';
import { useLongLivingState } from '../../hooks/useLongLivingState';

interface Props {
    children: React.ReactNode;
}

/**
 * It's a duplicate of the origina NotificationProvider for testing purpose
 * The main (only?) difference is that it uses a "long living state" for notification
 * In order to simplify tests no making Jest scream at any notification happening too late
 * YET it's still relevant to try to prevent any async leak from your tests
 */
const NotificationsTestProvider = ({ children }: Props) => {
    const [notifications, setNotifications] = useLongLivingState<NotificationOptions[]>([]);
    const managerRef = useRef<ReturnType<typeof createNotificationManager>>();

    if (!managerRef.current) {
        managerRef.current = createNotificationManager(setNotifications as any);
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

export default NotificationsTestProvider;
