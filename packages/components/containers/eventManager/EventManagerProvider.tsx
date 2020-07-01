import React, { useEffect } from 'react';

import EventManagerContext from './context';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';

interface Props {
    eventManager: ReturnType<typeof createEventManager>;
    children: React.ReactNode;
}

const EventManagerProvider = ({ eventManager, children }: Props) => {
    useEffect(() => {
        eventManager.start();
        return () => {
            eventManager.stop();
            eventManager.reset();
        };
    }, []);

    return <EventManagerContext.Provider value={eventManager}>{children}</EventManagerContext.Provider>;
};

export default EventManagerProvider;
