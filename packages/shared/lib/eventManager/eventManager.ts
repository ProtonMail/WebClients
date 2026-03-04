import noop from '@proton/utils/noop';

import { getApiError } from '../api/helpers/apiErrorHelper';
import { FIBONACCI_LIST } from '../constants';
import type { Listener } from '../helpers/listeners';
import createListeners from '../helpers/listeners';
import { onceWithQueue } from '../helpers/onceWithQueue';
import { eventLoopTimingTracker } from '../metrics/eventLoopMetrics';
import { type TimeoutIntervalsState, getTimeoutIntervalsStateSingleton } from './TimeoutIntervalsState';
import { type VisibilityState, getVisibilityStateSingleton } from './VisibilityState';
import { type EventLoopParams, getEventLoopParams } from './eventLoopParams';
import { getIntervalTypeFromVisibility } from './getIntervalTypeFromVisibility';

interface DefaultEventResult {
    More: 0 | 1;
    EventID: string;
}

interface FetchConfig {
    silence: boolean;
    signal: AbortSignal;
}

type GetEventsFetchConfig = FetchConfig & { params: EventLoopParams };

type GetEvents<EventResult> = (
    options: GetEventsFetchConfig & {
        eventID: string;
    }
) => Promise<EventResult>;
type GetLatestEventID = (options: FetchConfig) => Promise<string>;

type EventManagerConfigBase<EventResult> = {
    timeoutIntervalsState?: TimeoutIntervalsState;
    visibilityState?: VisibilityState;
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

interface EventManagerState {
    retryIndex: number;
    lastEventID?: string;
    timeoutHandle?: ReturnType<typeof setTimeout>;
    timeoutStartTime?: number;
    timeoutStartDelay?: number;
    abortController?: AbortController;
}

function handleVisibilityChange(
    isVisible: boolean,
    state: EventManagerState,
    timeoutIntervalsState: TimeoutIntervalsState
) {
    // No need to do anything if it became hidden.
    if (!isVisible) {
        return;
    }
    const { timeoutStartTime, timeoutStartDelay, timeoutHandle, retryIndex } = state;
    // No need to do anything if the event loop is not running.
    if (timeoutStartTime === undefined || timeoutStartDelay === undefined || timeoutHandle === undefined) {
        return;
    }
    // No need to do anything if the foreground and background intervals are equal
    if (timeoutIntervalsState.isForegroundEqualToBackground()) {
        return;
    }
    // Compute the next expected call time.
    const nextCallTime = timeoutStartTime + timeoutStartDelay;
    // Compute at what time the next call time would have been if the event loop had been running in foreground.
    const nextForegroundCallTime =
        timeoutStartTime + timeoutIntervalsState.getInterval('foreground') * FIBONACCI_LIST[retryIndex];
    // If the next call is scheduled inside a min delay, either:
    // because it's already been rescheduled to foreground, or
    // it was soon enough for background, then ignore.
    const minDelay = 50;
    if (nextCallTime - nextForegroundCallTime < minDelay) {
        return;
    }
    const now = Date.now();
    // Compute the difference between the next foreground call time and now.
    // Take a max with min delay, instead of doing it immediately, to avoid slowing down the UI on becoming visible.
    const diff = Math.max(minDelay, nextForegroundCallTime - now);
    return { now, delay: diff };
}

/**
 * Create the event manager process.
 */
const createEventManager = <EventResult = DefaultEventResult>({
    eventID: initialEventID,
    getLatestEventID,
    timeoutIntervalsState = getTimeoutIntervalsStateSingleton(),
    visibilityState = getVisibilityStateSingleton(),
    parseResults = defaultParseResults,
    getEvents,
}: EventManagerConfig<EventResult>): EventManager<EventResult> => {
    const listeners = createListeners<[EventResult]>();

    if (!initialEventID && !getLatestEventID) {
        throw new Error('eventID must be provided.');
    }

    let STATE: EventManagerState = {
        retryIndex: 0,
        lastEventID: initialEventID,
        timeoutHandle: undefined,
        timeoutStartTime: undefined,
        timeoutStartDelay: undefined,
        abortController: undefined,
    };

    const scheduleCall = (now: number, delay: number) => {
        // Clear the current timeout.
        clearTimeout(STATE.timeoutHandle);
        STATE.timeoutStartTime = now;
        STATE.timeoutStartDelay = delay;
        // eslint-disable-next-line
        STATE.timeoutHandle = setTimeout(call, delay);
    };

    const unsubscribeVisibilityState = visibilityState.subscribe((isVisible) => {
        const reschedule = handleVisibilityChange(isVisible, STATE, timeoutIntervalsState);
        if (reschedule) {
            scheduleCall(reschedule.now, reschedule.delay);
        }
    });

    const unsubscribeTimeoutIntervals = timeoutIntervalsState.subscribe();

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

        if (timeoutHandle !== undefined) {
            return;
        }

        const intervalType = getIntervalTypeFromVisibility(visibilityState.visible);
        const ms = timeoutIntervalsState.getInterval(intervalType) * FIBONACCI_LIST[retryIndex];
        scheduleCall(Date.now(), ms);
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

        if (timeoutHandle !== undefined) {
            clearTimeout(timeoutHandle);
            delete STATE.timeoutHandle;
            delete STATE.timeoutStartTime;
            delete STATE.timeoutStartDelay;
        }
    };

    /**
     * Stop the event manager and reset its state.
     */
    const reset = () => {
        stop();
        STATE = { retryIndex: 0 };
        listeners.clear();
        unsubscribeVisibilityState();
        unsubscribeTimeoutIntervals();
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
                        params: getEventLoopParams({
                            intervalType: getIntervalTypeFromVisibility(visibilityState.visible),
                        }),
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
