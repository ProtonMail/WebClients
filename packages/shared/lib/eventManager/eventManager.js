import { INTERVAL_EVENT_TIMER } from '../constants';
import { getEvents } from '../api/events';
import { onceWithQueue } from '../helpers/onceWithQueue';

const FIBONACCI = [1, 1, 2, 3, 5, 8];

/**
 * Create the event manager process.
 * @param {function} api - Function to call the API.
 * @param {String} initialEventId - Initial event ID to begin from
 * @param {function} onSuccess - Function to handle the data from the event manager
 * @param {function} onError - Function to handle the error
 * @return {{call, setEventID, stop, start, reset}}
 */
export default ({ api, eventId: initialEventId, onSuccess, onError }) => {
    let STATE = {
        lastEventID: initialEventId,
        timeoutHandle: undefined,
        retryIndex: 0,
        abortController: undefined
    };

    const setEventID = (eventID) => {
        STATE.lastEventID = eventID;
    };

    const start = () => {
        const { timeoutHandle, retryIndex } = STATE;
        if (timeoutHandle) {
            return;
        }
        const ms = INTERVAL_EVENT_TIMER * FIBONACCI[retryIndex];
        // eslint-disable-next-line
        STATE.timeoutHandle = setTimeout(call, ms);
    };

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

    const reset = () => {
        stop();
        STATE = {};
    };

    const run = async () => {
        try {
            const abortController = new AbortController();
            STATE.abortController = abortController;
            const { More, EventID, ...rest } = await api({
                ...getEvents(STATE.lastEventID),
                signal: abortController.signal
            });

            await onSuccess(rest);
            setEventID(EventID);
            STATE.retryIndex = 0;

            if (More === 1) {
                return run();
            }
        } catch (e) {
            // Increase the retry index when the call fails to not spam.
            if (STATE.retryIndex < FIBONACCI.length - 1) {
                STATE.retryIndex++;
            }
            onError(e);
            throw e;
        }
    };

    const call = onceWithQueue(async () => {
        try {
            stop();
            await run();
            start();
        } catch (e) {
            start();
            throw e;
        }
    });

    return {
        setEventID,
        start,
        stop,
        call,
        reset
    };
};
