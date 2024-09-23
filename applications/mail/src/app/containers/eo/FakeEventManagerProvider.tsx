import type { ReactNode } from 'react';

import { EventManagerContext } from '@proton/components';
import type createEventManager from '@proton/shared/lib/eventManager/eventManager';

interface Props {
    children: ReactNode;
}

/**
    This Provider is used in EO. In some components (e.g. LinkConfirmationModal) we are using the Event Manager,
    But we do not have any session in EO, meaning that we need to "Fake" calls to this Provider
 */
const FakeEventManagerProvider = ({ children }: Props) => {
    const fakeEventManager = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setEventID: (eventID: string) => {},
        getEventID: () => {
            return undefined;
        },
        start: () => {},
        stop: () => {},
        call: () => {
            // @ts-ignore
            return new Promise<void>();
        },
        reset: () => {},
    } as ReturnType<typeof createEventManager>;

    return <EventManagerContext.Provider value={fakeEventManager}>{children}</EventManagerContext.Provider>;
};

export default FakeEventManagerProvider;
