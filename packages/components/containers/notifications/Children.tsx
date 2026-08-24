import React, { useContext } from 'react';

import { NotificationsContext } from '@proton/app-context/notifications/notificationsContext';

import NotificationsContainer from './Container';
import NotificationsChildrenContext from './childrenContext';

const NotificationsChildren = () => {
    const manager = useContext(NotificationsContext);
    const { notifications, offset } = useContext(NotificationsChildrenContext);

    return (
        <NotificationsContainer
            notifications={notifications}
            offset={offset}
            removeDuplicate={manager.removeDuplicate}
            removeNotification={manager.removeNotification}
            hideNotification={manager.hideNotification}
        />
    );
};

export default NotificationsChildren;
