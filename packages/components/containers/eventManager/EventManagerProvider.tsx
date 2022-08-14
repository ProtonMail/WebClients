import { ReactNode, useEffect } from 'react';

import createEventManager from '@proton/shared/lib/eventManager/eventManager';

import EventManagerContext from './context';

interface Props {
    eventManager: ReturnType<typeof createEventManager>;
    children: ReactNode;
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
