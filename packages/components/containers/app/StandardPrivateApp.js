import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { EventManagerProvider, ModalsChildren, ThemeInjector } from 'react-components';

import EventModelListener from '../eventManager/EventModelListener';
import EventNotices from '../eventManager/EventNotices';
import LoaderPage from './LoaderPage';
import StandardPreload from './StandardPreload';
import ForceRefreshProvider from '../forceRefresh/Provider';

const StandardPrivateApp = ({ locales = {}, onLogout, preloadModels = [], eventModels = [], children }) => {
    const [loading, setLoading] = useState(true);
    const eventManagerRef = useRef();

    if (loading) {
        return (
            <>
                <StandardPreload
                    locales={locales}
                    preloadModels={preloadModels}
                    onSuccess={(ev) => {
                        eventManagerRef.current = ev;
                        setLoading(false);
                    }}
                    onError={onLogout}
                />
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    return (
        <EventManagerProvider eventManager={eventManagerRef.current}>
            <EventModelListener models={eventModels} />
            <EventNotices />
            <ThemeInjector />
            <ModalsChildren />
            <ForceRefreshProvider>{children}</ForceRefreshProvider>
        </EventManagerProvider>
    );
};

StandardPrivateApp.propTypes = {
    onLogout: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    locales: PropTypes.object,
    preloadModels: PropTypes.array,
    eventModels: PropTypes.array
};

export default StandardPrivateApp;
