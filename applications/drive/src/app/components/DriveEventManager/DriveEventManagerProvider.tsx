import { useEffect, useRef, createContext, ReactNode, useContext } from 'react';
import { useApi } from '@proton/components';
import createEventManager, { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { queryEvents, queryLatestEvents } from '@proton/shared/lib/api/drive/share';
import { LinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

export interface ShareEvent {
    EventType: EVENT_TYPES;
    Data: any;
    Link: LinkMeta;
}

interface EventManagersByShares {
    [shareId: string]: EventManager;
}

interface EventManagerProviderState {
    getShareEventManager: (shareId: string) => EventManager;
    createShareEventManager: (shareId: string) => Promise<EventManager>;
    stopListeningForShareEvents: (shareId: string) => void;
}

const EventManagerContext = createContext<EventManagerProviderState | null>(null);

const DriveEventManagerProvider = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    const shareEventManagers = useRef<EventManagersByShares>({});

    useEffect(() => {
        return () => {
            if (shareEventManagers.current) {
                Object.values(shareEventManagers.current).forEach(({ stop, reset }) => {
                    stop();
                    reset();
                });
            }
        };
    }, []);

    const createShareEventManager = async (shareId: string) => {
        const { EventID } = await api<{ EventID: string }>(queryLatestEvents(shareId));
        const eventManager = createEventManager({
            api,
            eventID: EventID,
            query: (eventId: string) => queryEvents(shareId, eventId),
        });
        shareEventManagers.current[shareId] = eventManager;

        return eventManager;
    };

    const getShareEventManager = (shareId: string) => {
        return shareEventManagers.current[shareId];
    };

    const stopListeningForShareEvents = (shareId: string) => {
        shareEventManagers.current[shareId]?.stop();
    };

    return (
        <EventManagerContext.Provider
            value={{
                getShareEventManager,
                createShareEventManager,
                stopListeningForShareEvents,
            }}
        >
            {children}
        </EventManagerContext.Provider>
    );
};

export const useDriveEventManager = () => {
    const state = useContext(EventManagerContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveEventManagerProvider');
    }
    return state;
};

export default DriveEventManagerProvider;
