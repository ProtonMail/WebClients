import type { ReactNode } from 'react';

import { EventManagerContext } from '@proton/components';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

interface Props {
    children: ReactNode;
}

/**
 This Provider is used in EO. In some components (e.g. LinkConfirmationModal) we are using the Event Manager,
 But we do not have any session in EO, meaning that we need to "Fake" calls to this Provider
 */
const FakeEventManagerProvider = ({ children }: Props) => {
    const fakeEventManager: EventManager<any> = {
        setEventID: () => {},
        getEventID: () => {
            return undefined;
        },
        start: () => {},
        stop: () => {},
        call: () => {
            // @ts-ignore
            return new Promise<void>();
        },
        subscribe: () => () => {},
        reset: () => {},
    };

    return <EventManagerContext.Provider value={fakeEventManager}>{children}</EventManagerContext.Provider>;
};

export default FakeEventManagerProvider;
