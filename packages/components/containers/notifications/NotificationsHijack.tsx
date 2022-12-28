import { FC } from 'react';

import { CreateNotificationOptions, NotificationsContext, NotificationsContextValue } from '@proton/components';
import noop from '@proton/utils/noop';

interface NotificationsHijackProps {
    onCreate: ((options: CreateNotificationOptions) => void) | undefined;
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
        clearNotifications: noop,
        setOffset: noop,
    };

    return <NotificationsContext.Provider value={context}>{children}</NotificationsContext.Provider>;
};

export default NotificationsHijack;
