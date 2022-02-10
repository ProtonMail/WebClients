import { createContext, useContext, useRef, ReactNode } from 'react';

import { useApi, useEventManager, generateUID } from '@proton/components';
import { Api } from '@proton/shared/lib/interfaces';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';
import { queryLatestEvents, queryEvents } from '@proton/shared/lib/api/drive/share';
import createEventManager, { EventManager } from '@proton/shared/lib/eventManager/eventManager';

import { driveEventsResultToDriveEvents } from '../api';
import { logError } from '../utils';
import { EventHandler } from './interface';

const DRIVE_EVENT_HANDLER_PREFIX = 'drive-event-handler';

export function useDriveEventManagerProvider(api: Api, generalEventManager: EventManager) {
    const eventHandlers = useRef(new Map<string, EventHandler>());
    const eventManagers = useRef(new Map<string, EventManager>());

    const genericHandler = (shareId: string, driveEvents: DriveEventsResult) => {
        if (!driveEvents.Events?.length) {
            return;
        }

        const handlerPromises: unknown[] = [];
        eventHandlers.current.forEach((handler) => {
            handlerPromises.push(handler(shareId, driveEventsResultToDriveEvents(driveEvents)));
        });

        /*
            forcing .poll function's returned Promise to be resolved
            *after* event processin is finished
        */
        return Promise.all(handlerPromises);
    };

    const createShareEventManager = async (shareId: string) => {
        const { EventID } = await api<{ EventID: string }>(queryLatestEvents(shareId));

        const eventManager = createEventManager({
            api,
            eventID: EventID,
            query: (eventId: string) => queryEvents(shareId, eventId),
        });

        eventManagers.current.set(shareId, eventManager);

        return eventManager;
    };

    /**
     * Creates event manager for specific share and starts interval polling of event.
     * If there's already an event manager associated with passed shareId, function
     * does nothing returning Promise<false>
     */
    const subscribeToShare = async (shareId: string): Promise<boolean> => {
        if (eventManagers.current.get(shareId)) {
            return false;
        }

        const eventManager = await createShareEventManager(shareId);
        eventManager.subscribe((payload: DriveEventsResult) => genericHandler(shareId, payload));
        eventManager.start();
        return true;
    };

    /**
     * Pauses event polling for specific share. Returns false if there's no event manager
     * associated with passed shareId
     */
    const pauseShareSubscription = (shareId: string): boolean => {
        if (!eventManagers.current.get(shareId)) {
            return false;
        }

        eventManagers.current.get(shareId)?.stop();
        return true;
    };

    /**
     * Stops event listening, empties handlers and clears reference to the event manager
     */
    const unsubscribeFromShare = (shareId: string): boolean => {
        eventManagers.current.get(shareId)?.reset();
        return eventManagers.current.delete(shareId);
    };

    /**
     * Poll events for specific share
     */
    const pollShare = async (shareId: string): Promise<void> => {
        const eventManager = eventManagers.current.get(shareId);

        if (!eventManager) {
            captureMessage('Trying to call non-existing event manager');
            return;
        }

        await eventManager.call().catch(logError);
    };

    /**
     * Polls event from all active event loop associcated with passed shareId
     */
    const pollAllShareEvents = async (shareId: string): Promise<void> => {
        const pollingPromises = [pollShare(shareId), generalEventManager.call()];
        await Promise.all(pollingPromises).catch(logError);
    };

    /**
     *  Polls drive events for all subscribed shares
     */
    const pollAllDriveEvents = async (): Promise<void> => {
        const pollingPromises: Promise<unknown>[] = [];
        eventManagers.current.forEach((eventManager) => {
            pollingPromises.push(eventManager.call());
        });
        await Promise.all(pollingPromises).catch(logError);
    };

    /**
     * Registers passed event handler to process currenlty active share subscriptions by specific id
     */
    const registerEventHandlerById = (id: string, callback: EventHandler): string => {
        eventHandlers.current.set(id, callback);
        return id;
    };

    /**
     * Registers passed event handler to process currenlty active share subscriptions
     */
    const registerEventHandler = (callback: EventHandler): string => {
        const callbackUID = generateUID(DRIVE_EVENT_HANDLER_PREFIX);
        return registerEventHandlerById(callbackUID, callback);
    };

    /**
     * Removes event handler
     */
    const unregisterEventHandler = (callbackId: string): boolean => {
        return eventHandlers.current.delete(callbackId);
    };

    /**
     * List share ids which event manager subscribed to
     */
    const getSubscriptionIds = (): string[] => {
        return Array.from(eventManagers.current.keys());
    };

    /**
     * Cancels all ongoing requests, clears timeout and references to all listeners
     * event managers and handlers
     */
    const clear = () => {
        // clear timeouts and listeners
        eventManagers.current.forEach((eventManager, key) => {
            unsubscribeFromShare(key);
        });
        // clear references to event managers
        eventManagers.current.clear();
        // clear event handlers
        eventHandlers.current.clear();
    };

    return {
        subscribeToShare,
        unsubscribeFromShare,
        pauseShareSubscription,
        registerEventHandler,
        registerEventHandlerById,
        unregisterEventHandler,
        pollAllShareEvents,
        pollShare,
        pollAllDriveEvents,
        getSubscriptionIds,
        clear,
    };
}

const DriveEventManagerContext = createContext<ReturnType<typeof useDriveEventManagerProvider> | null>(null);

export function DriveEventManagerProvider({ children }: { children: React.ReactNode }) {
    const api = useApi();
    const generalEventManager = useEventManager();
    const driveEventManager = useDriveEventManagerProvider(api, generalEventManager);

    return <DriveEventManagerContext.Provider value={driveEventManager}>{children}</DriveEventManagerContext.Provider>;
}

export const useDriveEventManager = () => {
    const state = useContext(DriveEventManagerContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveEventManagerProvider');
    }
    return state;
};

export type DriveEventManagerProviderProps = {
    api: Api;
    generalEventManager: EventManager;
    children: ReactNode;
};
