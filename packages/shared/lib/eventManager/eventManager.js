import { INTERVAL_EVENT_TIMER } from '../constants';
import { getEvents } from '../api/events';
import { onceWithQueue } from '../helpers/onceWithQueue';
import createListeners from '../helpers/listeners';

const FIBONACCI = [1, 1, 2, 3, 5, 8];

/**
 * Create the event manager process.
 *
 *    `api` - Function to call the API.
 *    `initialEventID` - Initial event ID to begin from.
 *    `interval` - Maximum interval time to wait between each call.
 *    `query` - Event polling endpoint override.
 *
 * @param {{ api: Function, initialEventID: String, interval?: Number, query?: Function }} config
 */
export default ({ api, eventID: initialEventID, interval = INTERVAL_EVENT_TIMER, query = getEvents }) => {
    const listeners = createListeners();

    if (!initialEventID) {
        throw new Error('eventID must be provided.');
    }

    let STATE = {
        lastEventID: initialEventID,
        timeoutHandle: undefined,
        retryIndex: 0,
        abortController: undefined
    };

    /**
     * @param {String} eventID
     */
    const setEventID = (eventID) => {
        STATE.lastEventID = eventID;
    };

    /**
     * @return {String}
     */
    const getEventID = () => {
        return STATE.lastEventID;
    };

    /**
     * @param {Number} index
     */
    const setRetryIndex = (index) => {
        STATE.retryIndex = index;
    };

    /**
     * @return {number}
     */
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
        STATE = {};
        listeners.clear();
    };

    /**
     * Call the event manager. Either does it immediately, or queues the call until after the current call has finished.
     * @return {Promise}
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

                const result = await api({
                    ...query(eventID),
                    signal: abortController.signal,
                    silence: true
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
            listeners.notify({ error });
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
        subscribe: listeners.subscribe
    };
};
