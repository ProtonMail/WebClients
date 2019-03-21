import React, { useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';

import NotificationsContext from '../../context/notifications';
import NotificationsContainer from './Container';
import useInstance from '../../hooks/useInstance';
import reducer from './reducer';
import createManager from './manager';

const NotificationsProvider = ({ children }) => {
    const [notifications, dispatch] = useReducer(reducer, []);
    const manager = useInstance(() => createManager(dispatch));

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
