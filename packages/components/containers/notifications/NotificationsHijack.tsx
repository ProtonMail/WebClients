import type { FC, ReactNode } from 'react';

import type { CreateNotificationOptions } from '@proton/app-context/notifications/interfaces';
import {
    NotificationsContext,
    type NotificationsContextValue,
} from '@proton/app-context/notifications/notificationsContext';
import noop from '@proton/utils/noop';

interface NotificationsHijackProps {
    onCreate: ((options: CreateNotificationOptions) => void) | undefined;
    children?: ReactNode;
}

const NotificationsHijack: FC<NotificationsHijackProps> = ({ children, onCreate }) => {
    if (!onCreate) {
        return <>{children}</>;
    }

    const hijackedCreateNotification = (options: CreateNotificationOptions) => {
        onCreate(options);

        /* createNotification has to return a number */
        return 42;
    };

    const context: NotificationsContextValue = {
        createNotification: hijackedCreateNotification,
        removeNotification: noop,
        hideNotification: noop,
        removeDuplicate: noop,
        clearNotifications: noop,
        setOffset: noop,
    };

    return <NotificationsContext.Provider value={context}>{children}</NotificationsContext.Provider>;
};

export default NotificationsHijack;
