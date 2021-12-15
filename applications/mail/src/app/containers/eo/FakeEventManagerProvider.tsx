import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { ReactNode } from 'react';
import EventManagerContext from '@proton/components/containers/eventManager/context';

interface Props {
    children: ReactNode;
}

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
