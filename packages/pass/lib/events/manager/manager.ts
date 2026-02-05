import type { Maybe } from '@proton/pass/types';
import type { Api } from '@proton/pass/types/api';
import { logger } from '@proton/pass/utils/logger';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';
import createListeners from '@proton/shared/lib/helpers/listeners';
import { onceWithQueue } from '@proton/shared/lib/helpers/onceWithQueue';

import { ACTIVE_POLLING_TIMEOUT } from './constants';

export type EventManagerEvent<T extends {}> = T | { error: unknown };
export type EventCursor = { EventID: string; More: boolean };

export const NOOP_EVENT = '*';

export type EventManagerConfig<T extends {}> = {
    api: Api /* Function to call the API */;
    interval?: number /* Maximum interval time to wait between each call */;
    initialEventID: string;
    query: (eventID: string) => {} /* Event polling endpoint override */;
    getCursor: (event: T) => EventCursor;
    getLatestEventID?: () => Promise<string> | string;
};

export type EventManager<T extends {}> = {
    state: EventManagerState;
    setEventID: (eventID: Maybe<string>) => void;
    getEventID: () => Maybe<string>;
    start: () => void;
    stop: () => void;
    call: () => Promise<void>;
    reset: () => void;
    setInterval: (interval: number) => void;
    subscribe: (listener: (event: EventManagerEvent<T>) => void) => () => void;
};

type EventManagerState = {
    interval: number;
    retryIndex: number;
    lastEventID?: string;
    timeoutHandle?: any;
    abortController?: AbortController;
};

export const eventManager = <T extends {}>({
    api,
    interval = ACTIVE_POLLING_TIMEOUT,
    initialEventID,
    query,
    getCursor,
    getLatestEventID,
}: EventManagerConfig<T>): EventManager<T> => {
    const listeners = createListeners<[EventManagerEvent<T>]>();

    const state: EventManagerState = { interval, retryIndex: 0, lastEventID: initialEventID };

    const setInterval = (nextInterval: number) => (state.interval = nextInterval);
    const setEventID = (eventID: Maybe<string>) => (state.lastEventID = eventID);
    const getEventID = () => (state.lastEventID ? state.lastEventID : undefined);
    const setRetryIndex = (index: number) => (state.retryIndex = index);
    const getRetryIndex = () => state.retryIndex;

    /* Increase the retry index when the call fails to not spam */
    const increaseRetryIndex = () => {
        const index = getRetryIndex();
        if (index < FIBONACCI_LIST.length - 1) setRetryIndex(index + 1);
    };

    /* Start the event manager, does nothing if it is already started */
    const start = (callFn: () => Promise<void>) => {
        if (!state.timeoutHandle) {
            const ms = state.interval * FIBONACCI_LIST[state.retryIndex];
            state.timeoutHandle = setTimeout(callFn, ms);
        }
    };

    /* Stop the event manager, does nothing if it's already stopped */
    const stop = () => {
        if (state.abortController) {
            state.abortController.abort();
            delete state.abortController;
        }

        if (state.timeoutHandle) {
            clearTimeout(state.timeoutHandle);
            delete state.timeoutHandle;
        }
    };

    /* Stop the event manager and reset its state */
    const reset = () => {
        stop();

        state.retryIndex = 0;
        state.interval = interval;
        delete state.abortController;
        delete state.lastEventID;
        delete state.timeoutHandle;

        listeners.clear();
    };

    /* Call the event manager. Either does it immediately, or queues
     * the call until after the current call has finished */
    const call = onceWithQueue(async () => {
        try {
            stop();

            const abortController = new AbortController();
            state.abortController = abortController;

            while (true) {
                const eventID = getEventID() ?? (await getLatestEventID?.());

                if (!eventID) {
                    logger.warn('No valid `EventID` provided');
                    return;
                }

                const result = await api<T>({ ...query(eventID), signal: abortController.signal, silence: true });
                if (!result) return;

                const { More, EventID: nextEventID } = getCursor(result);
                setEventID(nextEventID);
                setRetryIndex(0);

                listeners.notify(result);

                if (!More) break;
            }

            delete state.abortController;
            start(call);
        } catch (error: any) {
            /* ⚠️ if the request failed due to a locked or inactive session :
             * do not restart the event-manager. For any other type of error,
             * we can safely increase the retry index and retry.. */
            const { appVersionBad, sessionInactive, sessionLocked } = api.getState();
            if (error.name === 'AbortError' || appVersionBad || sessionInactive || sessionLocked) return;

            delete state.abortController;
            increaseRetryIndex();
            start(call);

            listeners.notify({ error });
            throw error;
        }
    });

    return {
        setEventID,
        getEventID,
        setInterval,
        start: () => start(call),
        stop,
        call,
        reset,
        subscribe: listeners.subscribe,
        get state() {
            return state;
        },
    };
};
