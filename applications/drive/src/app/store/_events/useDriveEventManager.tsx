import { ReactNode, createContext, useContext, useRef } from 'react';

import { generateUID, useApi, useEventManager } from '@proton/components';
import { queryEvents, queryLatestEvents } from '@proton/shared/lib/api/drive/share';
import createEventManager, { EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Api } from '@proton/shared/lib/interfaces';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import { logError } from '../../utils/errorHandling';
import { driveEventsResultToDriveEvents } from '../_api';
import { EventHandler } from './interface';

const DRIVE_EVENT_HANDLER_ID_PREFIX = 'drive-event-handler';

const DRIVE_EVENT_MANAGER_FUNCTIONS_STUB = {
    getSubscriptionIds: () => [],
    clear: () => undefined,

    eventHandlers: {
        register: () => 'id',
        unregister: () => false,
    },

    shares: {
        startSubscription: () => {
            throw Error('Usage of uninitialized DriveEventManager!');
        },
        pauseSubscription: () => {},
        unsubscribe: () => {},
    },

    pollEvents: {
        shares: () => Promise.resolve(),
        driveEvents: () => Promise.resolve(),
    },
};

export function useDriveEventManagerProvider(api: Api, generalEventManager: EventManager) {
    const eventHandlers = useRef(new Map<string, EventHandler>());
    const eventManagers = useRef(new Map<string, EventManager>());

    const genericHandler = (shareId: string, driveEvents: DriveEventsResult) => {
        if (!driveEvents.Events?.length) {
            return;
        }

        const handlerPromises: unknown[] = [];
        eventHandlers.current.forEach((handler) => {
            handlerPromises.push(handler(shareId, driveEventsResultToDriveEvents(driveEvents, shareId)));
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
     */
    const subscribeToShare = async (shareId: string) => {
        const eventManager = await createShareEventManager(shareId);
        eventManager.subscribe((payload: DriveEventsResult) => genericHandler(shareId, payload));
        eventManagers.current.set(shareId, eventManager);
    };

    /**
     * Creates an event manager for specified share if doesn't exist,
     * and starts event polling
     */
    const startShareSubscription = async (shareId: string) => {
        if (!eventManagers.current.get(shareId)) {
            await subscribeToShare(shareId);
        }
        eventManagers.current.get(shareId)!.start();
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
     * Polls drive events for specific share
     * @private
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
     * Polls events for specified list of shares
     */
    const pollShareEvents = async (
        shareIds: string[],
        params: { includeCommon: boolean } = { includeCommon: false }
    ) => {
        const pollingTasks = [];

        if (params.includeCommon) {
            pollingTasks.push(generalEventManager.call());
        }

        pollingTasks.push(...shareIds.map((shareId) => pollShare(shareId)));

        await Promise.all(pollingTasks).catch(logError);
    };

    /**
     *  Polls drive events for all subscribed shares
     */
    const pollDriveEvents = async (): Promise<void> => {
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
        const callbackUID = generateUID(DRIVE_EVENT_HANDLER_ID_PREFIX);
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
        eventManagers.current.forEach((_, key) => {
            unsubscribeFromShare(key);
        });
        // clear references to event managers
        eventManagers.current.clear();
        // clear event handlers
        eventHandlers.current.clear();
    };

    return {
        getSubscriptionIds,
        clear,

        shares: {
            startSubscription: startShareSubscription,
            pauseSubscription: pauseShareSubscription,
            unsubscribe: unsubscribeFromShare,
        },

        eventHandlers: {
            register: registerEventHandler,
            unregister: unregisterEventHandler,
        },

        pollEvents: {
            shares: pollShareEvents,
            driveEvents: pollDriveEvents,
        },
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

export type DriveEventManagerProviderProps = {
    api: Api;
    generalEventManager: EventManager;
    children: ReactNode;
};
