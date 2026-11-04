import noop from '@proton/utils/noop';

import { getApiError } from '../api/helpers/apiErrorHelper';
import { FIBONACCI_LIST } from '../constants';
import type { Listener } from '../helpers/listeners';
import createListeners from '../helpers/listeners';
import { onceWithQueue } from '../helpers/onceWithQueue';
import { type TimeoutIntervalsState, getTimeoutIntervalsStateSingleton } from './TimeoutIntervalsState';
import { type VisibilityState, getVisibilityStateSingleton } from './VisibilityState';
import { type EventLoopParams, type EventLoopTrigger, getEventLoopParams } from './eventLoopParams';
import type { EventManagerIntervalTypes, EventManagerIntervals } from './eventManagerIntervals';
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
    /** Called once a batch of events has been received, before the listeners are notified. */
    onProcessingStart?: () => void;
    /** Called once the listeners have been notified and the next event ID has been set. */
    onProcessingEnd?: (hasMore: boolean) => void;
};

type EventManagerConfig<EventResult> = EventManagerConfigBase<EventResult> &
    /** Initial event ID to begin from */
    (
        | { eventID: string; getLatestEventID?: GetLatestEventID }
        | {
              eventID?: string;
              getLatestEventID: GetLatestEventID;
          }
    );

type SubscribeFn<Arguments extends any[], R = void> = (listener: Listener<Arguments, R>) => () => void;

export type EventManager<EventResult> = {
    setEventID: (eventID: string) => void;
    getEventID: () => string | undefined;
    start: () => void;
    stop: () => void;
    call: (trigger?: EventLoopTrigger) => Promise<void>;
    reset: () => void;
    subscribe: SubscribeFn<[EventResult]>;
    /**
     * Polls at the given intervals instead of the regular ones, when they are longer, until called
     * again with undefined. Meant for when another channel already signals new events, so that
     * polling is only a safety net. Optional as only the event managers created by
     * `createEventManager` support it.
     */
    setIntervalsOverride?: (intervals: EventManagerIntervals | undefined) => void;
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

/**
 * Returns how to reschedule the pending call so that it happens `interval` after the timeout started,
 * if that is sooner than currently scheduled.
 */
function getSoonerCall(state: EventManagerState, interval: number) {
    const { timeoutStartTime, timeoutStartDelay, timeoutHandle, retryIndex } = state;
    // No need to do anything if the event loop is not running.
    if (timeoutStartTime === undefined || timeoutStartDelay === undefined || timeoutHandle === undefined) {
        return;
    }
    // Compute the next expected call time.
    const nextCallTime = timeoutStartTime + timeoutStartDelay;
    // Compute at what time the next call time would have been with the given interval.
    const soonerCallTime = timeoutStartTime + interval * FIBONACCI_LIST[retryIndex];
    // If the next call is scheduled inside a min delay, either:
    // because it's already been rescheduled, or
    // it was soon enough anyway, then ignore.
    const minDelay = 50;
    if (nextCallTime - soonerCallTime < minDelay) {
        return;
    }
    const now = Date.now();
    // Compute the difference between the sooner call time and now.
    // Take a max with min delay, instead of doing it immediately, to avoid slowing down the UI on becoming visible.
    const diff = Math.max(minDelay, soonerCallTime - now);
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
    onProcessingStart,
    onProcessingEnd,
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
        STATE.timeoutHandle = setTimeout(() => call('Timer'), delay);
    };

    let intervalsOverride: EventManagerIntervals | undefined;

    // The override only ever extends the intervals, it never makes the event loop poll more often.
    const getInterval = (type: EventManagerIntervalTypes) =>
        Math.max(intervalsOverride?.[type] ?? 0, timeoutIntervalsState.getInterval(type));

    const rescheduleSooner = (interval: number) => {
        const reschedule = getSoonerCall(STATE, interval);
        if (reschedule) {
            scheduleCall(reschedule.now, reschedule.delay);
        }
    };

    const unsubscribeVisibilityState = visibilityState.subscribe((isVisible) => {
        // No need to do anything if it became hidden, or if the foreground and background intervals are equal.
        if (!isVisible || getInterval('foreground') === getInterval('background')) {
            return;
        }
        rescheduleSooner(getInterval('foreground'));
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
        const ms = getInterval(intervalType) * FIBONACCI_LIST[retryIndex];
        scheduleCall(Date.now(), ms);
    };

    const setIntervalsOverride = (intervals: EventManagerIntervals | undefined) => {
        intervalsOverride = intervals;
        // A pending call scheduled with a longer interval is brought forward, so that dropping the
        // override takes effect right away rather than after the extended interval. A longer
        // interval only applies from the next scheduled call.
        rescheduleSooner(getInterval(getIntervalTypeFromVisibility(visibilityState.visible)));
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
        intervalsOverride = undefined;
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
    const call = onceWithQueue(async (trigger: EventLoopTrigger = 'Code') => {
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
                            trigger,
                        }),
                    });
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        return;
                    }
                    throw error;
                }

                // Start timing for v5 event processing (data received, starting processing)
                onProcessingStart?.();

                await Promise.all(listeners.notify(result)).catch(noop);

                const { nextEventID, more } = parseResults(result);
                setEventID(nextEventID);
                setRetryIndex(0);

                // End timing for v5 event processing (new EventID is set)
                onProcessingEnd?.(more === 1);

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
        setIntervalsOverride,
    };
};

export default createEventManager;
