import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';

import NotificationsContext from './notificationsContext';
import NotificationsContainer from './Container';
import createManager from './manager';

const NotificationsProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const managerRef = useRef();

    if (!managerRef.current) {
        managerRef.current = createManager(setNotifications);
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

NotificationsProvider.propTypes = {
    children: PropTypes.node.isRequired
};
export default NotificationsProvider;
