import React, { useRef } from 'react';

import type { Notification } from '@proton/app-context/notifications/interfaces';
import createNotificationManager from '@proton/app-context/notifications/manager';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import NotificationsContainer from '@proton/components/containers/notifications/Container';
import { useLongLivingState } from '@proton/mail-composer/hooks/useLongLivingState';
import noop from '@proton/utils/noop';

interface Props {
    children: React.ReactNode;
}

/**
 * It's a duplicate of the original NotificationProvider for testing purpose
 * The main (only?) difference is that it uses a "long living state" for notification
 * In order to simplify tests no making Jest scream at any notification happening too late
 * YET it's still relevant to try to prevent any async leak from your tests
 */
const NotificationsTestProvider = ({ children }: Props) => {
    const [notifications, setNotifications] = useLongLivingState<Notification[]>([]);
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
