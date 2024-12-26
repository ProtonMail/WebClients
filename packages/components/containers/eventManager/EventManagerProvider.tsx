import type { ReactNode } from 'react';

import type { EventLoop } from '@proton/account/eventLoop';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

import EventManagerContext from './context';

interface Props {
    eventManager: EventManager<EventLoop>;
    children: ReactNode;
}

const EventManagerProvider = ({ eventManager, children }: Props) => {
    return <EventManagerContext.Provider value={eventManager}>{children}</EventManagerContext.Provider>;
};

export default EventManagerProvider;
