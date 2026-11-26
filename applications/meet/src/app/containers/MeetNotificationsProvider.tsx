import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';
import { useNotifications } from '@proton/app-context/useNotifications';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';

const getMeetNotificationIcon = ({ type, icon }: CreateNotificationOptions) => {
    if (icon) {
        return icon;
    }
    return type === 'warning' || type === 'error' ? IcExclamationCircle : undefined;
};

export const MeetNotificationsProvider = ({ children }: { children: ReactNode }) => {
    const notificationsManager = useNotifications();

    const meetNotificationsManager = useMemo(
        () => ({
            ...notificationsManager,
            createNotification: (options: CreateNotificationOptions) =>
                notificationsManager.createNotification({ ...options, icon: getMeetNotificationIcon(options) }),
        }),
        [notificationsManager]
    );

    return <NotificationsContext.Provider value={meetNotificationsManager}>{children}</NotificationsContext.Provider>;
};
