import React, { useContext } from 'react';

import NotificationsContainer from './Container';
import NotificationsChildrenContext from './childrenContext';
import NotificationsContext from './notificationsContext';

const NotificationsChildren = () => {
    const manager = useContext(NotificationsContext);
    const { notifications, offset } = useContext(NotificationsChildrenContext);

    return (
        <NotificationsContainer
            notifications={notifications}
            offset={offset}
            removeNotification={manager.removeNotification}
            hideNotification={manager.hideNotification}
        />
    );
};

export default NotificationsChildren;
