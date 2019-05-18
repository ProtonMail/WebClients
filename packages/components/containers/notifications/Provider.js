import React, { useRef, useState, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';

import NotificationsContext from '../../context/notifications';
import NotificationsContainer from './Container';
import createManager from './manager';

const NotificationsProvider = React.forwardRef(({ children }, ref) => {
    const [notifications, setNotifications] = useState([]);
    const managerRef = useRef();

    if (!managerRef.current) {
        managerRef.current = createManager(setNotifications);
    }

    const manager = managerRef.current;

    useImperativeHandle(ref, () => manager);

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
});

NotificationsProvider.propTypes = {
    children: PropTypes.node.isRequired
};
export default NotificationsProvider;
