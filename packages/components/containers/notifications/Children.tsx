import React, { useContext } from 'react';
import NotificationsContext from './notificationsContext';
import NotificationsChildrenContext from './childrenContext';
import NotificationsContainer from './Container';

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
