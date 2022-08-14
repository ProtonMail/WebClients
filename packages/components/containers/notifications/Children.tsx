import React, { useContext } from 'react';

import NotificationsContainer from './Container';
import NotificationsChildrenContext from './childrenContext';
import NotificationsContext from './notificationsContext';

const NotificationsChildren = () => {
    const manager = useContext(NotificationsContext);
    const children = useContext(NotificationsChildrenContext);

    return (
        <NotificationsContainer
            notifications={children}
            removeNotification={manager.removeNotification}
            hideNotification={manager.hideNotification}
        />
    );
};

export default NotificationsChildren;
