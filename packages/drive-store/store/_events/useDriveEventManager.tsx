import { createContext, useContext } from 'react';

import useEventManager from '@proton/components/hooks/useEventManager';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

import type { DriveCoreEvent } from './interface';

const DRIVE_EVENT_MANAGER_FUNCTIONS_STUB = {
    eventHandlers: {
        subscribeToCore: () => () => {},
    },
};

function useDriveEventManagerProvider(generalEventManager: EventManager<DriveCoreEvent>) {
    /**
     * Subscribe to core events from the general event manager
     */
    const subscribeToCoreEvents = (listener: (event: DriveCoreEvent) => void) => {
        return generalEventManager.subscribe((event) => {
            listener(event);
        });
    };

    return {
        eventHandlers: {
            subscribeToCore: subscribeToCoreEvents,
        },
    };
}

const DriveEventManagerContext = createContext<ReturnType<typeof useDriveEventManagerProvider> | null>(null);

export function DriveEventManagerProvider({ children }: { children: React.ReactNode }) {
    const generalEventManager = useEventManager();
    const driveEventManager = useDriveEventManagerProvider(generalEventManager);

    return <DriveEventManagerContext.Provider value={driveEventManager}>{children}</DriveEventManagerContext.Provider>;
}

export const useDriveEventManager = () => {
    const state = useContext(DriveEventManagerContext);
    if (!state) {
        // DriveEventManager might be uninitialized in some cases.
        // For example, public shares do not have this implemented yet.
        // Better would be to not have event manager as required automatic
        // dependency, but that requires bigger changes. In the end, this
        // situation is just because of how React hooks work. One day, once
        // this all is shifted to worker instead, we can make it nicer.
        return DRIVE_EVENT_MANAGER_FUNCTIONS_STUB;
    }
    return state;
};
