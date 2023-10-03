import noop from '@proton/utils/noop';

import { getEvents } from '../api/events';
import { FIBONACCI_LIST, INTERVAL_EVENT_TIMER } from '../constants';
import createListeners, { Listener } from '../helpers/listeners';
import { onceWithQueue } from '../helpers/onceWithQueue';
import { Api } from '../interfaces';

export enum EVENT_ID_KEYS {
    DEFAULT = 'EventID',
    CALENDAR = 'CalendarModelEventID',
}

type EventResponse = {
    [key in EVENT_ID_KEYS]: string;
} & {
    More: 0 | 1;
};

interface EventManagerConfig {
    /** Function to call the API */
    api: Api;
    /** Initial event ID to begin from */
    eventID: string;
    /** Maximum interval time to wait between each call */
    interval?: number;
    /** Event polling endpoint override */
    query?: (eventID: string) => object;
    eventIDKey?: EVENT_ID_KEYS;
}

export type SubscribeFn = <A extends any[], R = void>(listener: Listener<A, R>) => () => void;

export interface EventManager {
    setEventID: (eventID: string) => void;
    getEventID: () => string | undefined;
    start: () => void;
    stop: () => void;
    call: () => Promise<void>;
    reset: () => void;
    subscribe: SubscribeFn;
}

/**
 * Create the event manager process.
 */
const createEventManager = ({
    api,
    eventID: initialEventID,
    interval = INTERVAL_EVENT_TIMER,
    query = getEvents,
    eventIDKey = EVENT_ID_KEYS.DEFAULT,
}: EventManagerConfig): EventManager => {
    const listeners = createListeners<[EventResponse]>();

    if (!initialEventID) {
        throw new Error('eventID must be provided.');
    }

    let STATE: {
        retryIndex: number;
        lastEventID?: string;
        timeoutHandle?: ReturnType<typeof setTimeout>;
        abortController?: AbortController;
    } = {
        retryIndex: 0,
        lastEventID: initialEventID,
        timeoutHandle: undefined,
        abortController: undefined,
    };

    const setEventID = (eventID: string) => {
        STATE.lastEventID = eventID;
    };

    const getEventID = () => {
        return STATE.lastEventID;
    };

    const setRetryIndex = (index: number) => {
        STATE.retryIndex = index;
    };

    const getRetryIndex = () => {
        return STATE.retryIndex;
    };

    const increaseRetryIndex = () => {
        const index = getRetryIndex();
        // Increase the retry index when the call fails to not spam.
        if (index < FIBONACCI_LIST.length - 1) {
            setRetryIndex(index + 1);
        }
    };

    /**
     * Start the event manager, does nothing if it is already started.
     */
    const start = () => {
        const { timeoutHandle, retryIndex } = STATE;

        if (timeoutHandle) {
            return;
        }

        const ms = interval * FIBONACCI_LIST[retryIndex];
        // eslint-disable-next-line
        STATE.timeoutHandle = setTimeout(call, ms);
    };

    /**
     * Stop the event manager, does nothing if it's already stopped.
     */
    const stop = () => {
        const { timeoutHandle, abortController } = STATE;

        if (abortController) {
            abortController.abort();
            delete STATE.abortController;
        }

        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            delete STATE.timeoutHandle;
        }
    };

    /**
     * Stop the event manager and reset its state.
     */
    const reset = () => {
        stop();
        STATE = { retryIndex: 0 };
        listeners.clear();
    };

    /**
     * Call the event manager. Either does it immediately, or queues the call until after the current call has finished.
     */
    const call = onceWithQueue(async () => {
        try {
            stop();

            const abortController = new AbortController();
            STATE.abortController = abortController;

            for (;;) {
                const eventID = getEventID();

                if (!eventID) {
                    throw new Error('EventID undefined');
                }

                let result: EventResponse;
                try {
                    result = await api<EventResponse>({
                        ...query(eventID),
                        signal: abortController.signal,
                        silence: true,
                    });
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        return;
                    }
                    throw error;
                }

                await Promise.all(listeners.notify(result)).catch(noop);

                const { More, [eventIDKey]: nextEventID } = result;
                setEventID(nextEventID);
                setRetryIndex(0);

                if (!More) {
                    break;
                }
            }
            delete STATE.abortController;
            start();
        } catch (error: any) {
            delete STATE.abortController;
            increaseRetryIndex();
            start();
            throw error;
        }
    });

    return {
        setEventID,
        getEventID,
        start,
        stop,
        call,
        reset,
        subscribe: listeners.subscribe as SubscribeFn,
    };
};

export default createEventManager;
