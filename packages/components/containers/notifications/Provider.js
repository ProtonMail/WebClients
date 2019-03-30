import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import NotificationsContext from '../../context/notifications';
import NotificationsContainer from './Container';

const NotificationsProvider = ({ children, manager }) => {
    const [notifications, setNotifications] = useState(manager.get());

    useEffect(() => {
        const onChange = (newPrompts) => {
            setNotifications(newPrompts);
        };

        const unsubscribe = manager.subscribe(onChange);
        return () => {
            unsubscribe();
            manager.clearNotifications();
        };
    }, []);

    return (
        <NotificationsContext.Provider value={manager}>
            {children}
            <NotificationsContainer notifications={notifications} remove={manager.removeNotification} />
        </NotificationsContext.Provider>
    );
};

NotificationsProvider.propTypes = {
    children: PropTypes.node.isRequired,
    manager: PropTypes.object.isRequired
};
export default NotificationsProvider;
