import { getDefaultIntervalType } from '@proton/shared/lib/eventManager/getDefaultIntervalType';
import noop from '@proton/utils/noop';

import { getApiError } from '../api/helpers/apiErrorHelper';
import { FIBONACCI_LIST } from '../constants';
import type { Listener } from '../helpers/listeners';
import createListeners from '../helpers/listeners';
import { onceWithQueue } from '../helpers/onceWithQueue';
import { eventLoopTimingTracker } from '../metrics/eventLoopMetrics';
import { getDefaultIntervals } from './getDefaultIntervals';

interface DefaultEventResult {
    More: 0 | 1;
    EventID: string;
}

type GetEvents<EventResult> = (options: {
    eventID: string;
    signal: AbortSignal;
    silence: boolean;
}) => Promise<EventResult>;
type GetLatestEventID = (options: { signal: AbortSignal; silence: boolean }) => Promise<string>;

type EventManagerIntervals = { foreground: number; background: number };

type EventManagerConfigBase<EventResult> = {
    /** Maximum interval time to wait between each call */
    intervals?: EventManagerIntervals;
    getIntervalType?: () => keyof EventManagerIntervals;
    parseResults?: (value: EventResult) => { nextEventID: string; more: 0 | 1 };
    getEvents: GetEvents<EventResult>;
};

type EventManagerConfig<EventResult> = EventManagerConfigBase<EventResult> &
    /** Initial event ID to begin from */
    (| { eventID: string; getLatestEventID?: GetLatestEventID }
        | {
              eventID?: string;
              getLatestEventID: GetLatestEventID;
          }
    );

export type SubscribeFn<Arguments extends any[], R = void> = (listener: Listener<Arguments, R>) => () => void;

export type EventManager<EventResult> = {
    setEventID: (eventID: string) => void;
    getEventID: () => string | undefined;
    start: () => void;
    stop: () => void;
    call: () => Promise<void>;
    reset: () => void;
    subscribe: SubscribeFn<[EventResult]>;
};

const defaultParseResults: EventManagerConfigBase<any>['parseResults'] = (result: DefaultEventResult) => ({
    nextEventID: result.EventID,
    more: result.More,
});

/**
 * Create the event manager process.
 */
const createEventManager = <EventResult = DefaultEventResult>({
    eventID: initialEventID,
    getLatestEventID,
    intervals = getDefaultIntervals(),
    getIntervalType = getDefaultIntervalType, // Allow to pass a different interval type getter in case the event loop is running in a different context, like a WebWorker
    parseResults = defaultParseResults,
    getEvents,
}: EventManagerConfig<EventResult>): EventManager<EventResult> => {
    const listeners = createListeners<[EventResult]>();

    if (!initialEventID && !getLatestEventID) {
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

        const intervalType = getIntervalType();
        const ms = intervals[intervalType] * FIBONACCI_LIST[retryIndex];
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

    const getInitialEventIDPromise = async () => {
        if (initialEventID) {
            return initialEventID;
        }

        if (getLatestEventID) {
            const abortController = new AbortController();
            STATE.abortController = abortController;

            try {
                const latestEventID = await getLatestEventID({ signal: abortController.signal, silence: true });
                if (latestEventID && !getEventID()) {
                    setEventID(latestEventID);
                }
                return latestEventID;
            } catch (e) {
                // Swallow any errors. This will anyway get retried in the call if event id is missing.
                return undefined;
            }
        }

        return undefined;
    };

    const initialEventIDPromise = getInitialEventIDPromise();

    /**
     * Call the event manager. Either does it immediately, or queues the call until after the current call has finished.
     */
    const call = onceWithQueue(async () => {
        try {
            stop();

            await initialEventIDPromise;

            const abortController = new AbortController();
            STATE.abortController = abortController;

            for (;;) {
                let eventID = getEventID();

                if (!eventID && getLatestEventID) {
                    try {
                        eventID = await getLatestEventID({ signal: abortController.signal, silence: true });
                    } catch (error: any) {
                        if (error.name === 'AbortError') {
                            return;
                        }
                        const { status } = getApiError(error);
                        if (status >= 400 && status <= 499) {
                            // In case it fails to fetch the latest event id due to a 4xx error, it is assumed
                            // that this event loop is invalid and is subsequently stopped
                            stop();
                            return;
                        }
                        // Otherwise, if 5xx, offline, or any other error, it's thrown so that it's later retried
                        throw error;
                    }
                }

                if (!eventID) {
                    throw new Error('EventID undefined');
                }

                let result: EventResult;
                try {
                    result = await getEvents({
                        eventID,
                        signal: abortController.signal,
                        silence: true,
                    });
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        return;
                    }
                    throw error;
                }

                // Start timing for v5 event processing (data received, starting processing)
                eventLoopTimingTracker.startV5Processing();

                await Promise.all(listeners.notify(result)).catch(noop);

                const { nextEventID, more } = parseResults(result);
                setEventID(nextEventID);
                setRetryIndex(0);

                // End timing for v5 event processing (new EventID is set)
                eventLoopTimingTracker.endV5Processing(more === 1);

                if (!more) {
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
        subscribe: listeners.subscribe,
    };
};

export default createEventManager;
