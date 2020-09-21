import { INTERVAL_EVENT_TIMER } from '../constants';
import { getEvents } from '../api/events';
import { onceWithQueue } from '../helpers/onceWithQueue';
import createListeners, { Listener } from '../helpers/listeners';
import { Api } from '../interfaces';

const FIBONACCI = [1, 1, 2, 3, 5, 8];

interface EventResponse {
    EventID: string;
    More: 0 | 1;
}

interface EventManagerConfig {
    /** Function to call the API */
    api: Api;
    /** Initial event ID to begin from */
    eventID: string;
    /** Maximum interval time to wait between each call */
    interval?: number;
    /** Event polling endpoint override */
    query?: (eventID: string) => object;
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
const eventManager = ({
    api,
    eventID: initialEventID,
    interval = INTERVAL_EVENT_TIMER,
    query = getEvents,
}: EventManagerConfig): EventManager => {
    const listeners = createListeners<[EventResponse]>();

    if (!initialEventID) {
        throw new Error('eventID must be provided.');
    }

    let STATE: {
        retryIndex: number;
        lastEventID?: string;
        timeoutHandle?: any;
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
        if (index < FIBONACCI.length - 1) {
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

        const ms = interval * FIBONACCI[retryIndex];
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

                const result = await api<EventResponse>({
                    ...query(eventID),
                    signal: abortController.signal,
                    silence: true,
                });

                await Promise.all(listeners.notify(result));

                const { More, EventID: nextEventID } = result;
                setEventID(nextEventID);
                setRetryIndex(0);

                if (!More) {
                    break;
                }
            }

            delete STATE.abortController;
            start();
        } catch (error) {
            listeners.notify({ error } as any);
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

export default eventManager;
