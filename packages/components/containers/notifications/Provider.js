import React, { useReducer, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import NotificationsContext from '../../context/notifications';
import NotificationsContainer from './Container';
import reducer from './reducer';
import createManager from './manager';

const NotificationsProvider = ({ children }) => {
    const [notifications, dispatch] = useReducer(reducer, []);

    // Using useState as a instance variable rather than useMemo because it can be cleared by react
    const [manager] = useState(() => createManager(dispatch));

    useEffect(() => {
        return () => manager.clearNotifications();
    }, []);

    return (
        <NotificationsContext.Provider value={manager}>
            {children}
            <NotificationsContainer notifications={notifications} remove={manager.removeNotification} />
        </NotificationsContext.Provider>
    );
};

NotificationsProvider.propTypes = {
    children: PropTypes.node.isRequired
};
export default NotificationsProvider;
