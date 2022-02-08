import { FC } from 'react';
import { CreateNotificationOptions, NotificationsContext, NotificationsContextValue } from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';

interface NotificationsHijackProps {
    onCreate: (options: CreateNotificationOptions) => void;
}

const NotificationsHijack: FC<NotificationsHijackProps> = ({ children, onCreate }) => {
    const hijackedCreateNotification = (options: CreateNotificationOptions) => {
        onCreate(options);

        /* createNotification has to return a number */
        return 42;
    };

    const context: NotificationsContextValue = {
        createNotification: hijackedCreateNotification,
        removeNotification: noop,
        hideNotification: noop,
        clearNotifications: noop,
    };

    return <NotificationsContext.Provider value={context}>{children}</NotificationsContext.Provider>;
};

export default NotificationsHijack;
