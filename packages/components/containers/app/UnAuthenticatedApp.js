import React from 'react';
import PropTypes from 'prop-types';
import { ApiContext, NotificationsProvider } from 'react-components';
import createState from 'proton-shared/lib/state/state';
import createNotificationsManager from 'proton-shared/lib/notifications/manager';

const UnAuthenticatedApp = ({ initApi, children }) => {
    const api = initApi();
    const notificationsManager = createNotificationsManager(createState([]));

    return (
        <NotificationsProvider manager={notificationsManager}>
            <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
        </NotificationsProvider>
    );
};

UnAuthenticatedApp.propTypes = {
    initApi: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired
};

export default UnAuthenticatedApp;
