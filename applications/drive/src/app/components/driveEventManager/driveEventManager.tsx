import { createContext, useContext, useRef } from 'react';

import { generateUID } from '@proton/components';
import { queryLatestEvents, queryEvents } from '@proton/shared/lib/api/drive/share';
import createEventManager, { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { DriveEventManagerProviderCallbacks, DriveEventManagerProviderProps, EventHandler } from './interface';

const DRIVE_EVENT_HANDLER_PREFIX = 'drive-event-handler';

const DriveEventManagerContext = createContext<DriveEventManagerProviderCallbacks | null>(null);

export function useEventManagerFunctions(
    api: DriveEventManagerProviderProps['api'],
    generalEventManager: DriveEventManagerProviderProps['generalEventManager']
) {
    const eventHandlers = useRef(new Map<string, EventHandler>());
    const eventManagers = useRef(new Map<string, EventManager>());

    const genericHandler: EventHandler = (eventsPayload, shareId) => {
        // In case of polling error events is undefined
        if (!eventsPayload?.Events) {
            return;
        }

        const handlerPromises: unknown[] = [];
        eventHandlers.current.forEach((handler) => {
            handlerPromises.push(handler(eventsPayload, shareId));
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
    const subscribeToShare: DriveEventManagerProviderCallbacks['subscribeToShare'] = async (shareId: string) => {
        if (eventManagers.current.get(shareId)) {
            return false;
        }

        const eventManager = await createShareEventManager(shareId);
        eventManager.subscribe((events) => genericHandler(events, shareId));
        eventManager.start();
        return true;
    };

    /**
     * Pauses event polling for specific share. Returns false if there's no event manager
     * associated with passed shareId
     */
    const pauseShareSubscription: DriveEventManagerProviderCallbacks['pauseShareSubscription'] = (shareId) => {
        if (!eventManagers.current.get(shareId)) {
            return false;
        }

        eventManagers.current.get(shareId)?.stop();
        return true;
    };

    /**
     * Stops event listening, empties handlers and clears reference to the event manager
     */
    const unsubscribeFromShare: DriveEventManagerProviderCallbacks['unregisterEventHandler'] = (shareId) => {
        eventManagers.current.get(shareId)?.reset();
        return eventManagers.current.delete(shareId);
    };

    /**
     * Poll events for specific share
     */
    const pollShare: DriveEventManagerProviderCallbacks['pollShare'] = (shareId) => {
        const eventManager = eventManagers.current.get(shareId);

        if (!eventManager) {
            throw new Error('Trying to call non-existing event manager');
        }

        return eventManager.call().catch(console.warn);
    };

    /**
     * Polls event from all active event loop associcated with passed shareId
     */
    const pollAllShareEvents: DriveEventManagerProviderCallbacks['pollAllShareEvents'] = (shareId) => {
        return Promise.all([pollShare(shareId), generalEventManager.call()]);
    };

    /**
     *  Polls drive events for all subscribed shares
     */
    const pollAllDriveEvents: DriveEventManagerProviderCallbacks['pollAllDriveEvents'] = () => {
        const pollingPromises: Promise<unknown>[] = [];
        eventManagers.current.forEach((eventManager) => {
            pollingPromises.push(eventManager.call());
        });

        return Promise.all(pollingPromises);
    };

    /**
     * Registers passed event handler to process currenlty active share subscriptions by specific id
     */
    const registerEventHandlerById: DriveEventManagerProviderCallbacks['registerEventHandlerById'] = (id, callback) => {
        eventHandlers.current.set(id, callback);
        return id;
    };

    /**
     * Registers passed event handler to process currenlty active share subscriptions
     */
    const registerEventHandler: DriveEventManagerProviderCallbacks['registerEventHandler'] = (callback) => {
        const callbackUID = generateUID(DRIVE_EVENT_HANDLER_PREFIX);
        return registerEventHandlerById(callbackUID, callback);
    };

    /**
     * Removes event handler
     */
    const unregisterEventHandler: DriveEventManagerProviderCallbacks['unregisterEventHandler'] = (callbackID) => {
        return eventHandlers.current.delete(callbackID);
    };

    /**
     * List share ids which event manager subscribed to
     */
    const getSubscriptionIds: DriveEventManagerProviderCallbacks['getSubscriptionIds'] = () => {
        return Array.from(eventManagers.current.keys());
    };

    /**
     * Cancels all ongoing requests, clears timeout and references to all listeners
     * event managers and handlers
     */
    const clear: DriveEventManagerProviderCallbacks['clear'] = () => {
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

export function DriveEventManagerProvider({ api, generalEventManager, children }: DriveEventManagerProviderProps) {
    const providerState = useEventManagerFunctions(api, generalEventManager);

    return <DriveEventManagerContext.Provider value={providerState}>{children}</DriveEventManagerContext.Provider>;
}

export const useDriveEventManager = () => {
    const state = useContext(DriveEventManagerContext);
    if (!state) {
        throw new Error('Trying to use uninitialized DriveEventManagerProvider');
    }
    return state;
};
