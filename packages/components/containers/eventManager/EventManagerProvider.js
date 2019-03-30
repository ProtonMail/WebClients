import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import EventManagerContext from './context';

const EventManagerProvider = ({ eventManager, children }) => {
    useEffect(() => {
        eventManager.start();
        return () => {
            eventManager.stop();
            eventManager.reset();
        };
    }, []);

    return <EventManagerContext.Provider value={eventManager}>{children}</EventManagerContext.Provider>;
};

EventManagerProvider.propTypes = {
    children: PropTypes.node.isRequired,
    eventManager: PropTypes.object.isRequired
};

export default EventManagerProvider;
