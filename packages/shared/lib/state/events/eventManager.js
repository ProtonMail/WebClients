import { INTERVAL_EVENT_TIMER } from '../../constants';
import { getEvents } from '../../api/events';
import { onceWithQueue } from '../../helpers/promise';

const FIBONACCI = [1, 1, 2, 3, 5, 8];

export default (api, success, error) => {
    let STATE = {
        lastEventID: undefined,
        timeoutHandle: undefined,
        retryIndex: 0,
        abortController: undefined
    };

    const run = async () => {
        try {
            STATE.abortController = new AbortController();
            const { More, EventID, ...rest } = await api({
                ...getEvents(STATE.lastEventID),
                signal: STATE.abortController.signal
            });

            await success(rest);

            setEventID(EventID);
            STATE.retryIndex = 0;

            if (More === 1) {
                return run();
            }
        } catch (e) {
            error(e);

            // Increase the retry index when the call fails to not spam.
            if (STATE.retryIndex < FIBONACCI.length - 1) {
                STATE.retryIndex++;
            }
        }
    };

    const call = onceWithQueue(async () => {
        stop();
        await run();
        start();
    });

    const setEventID = (eventID) => {
        STATE.lastEventID = eventID;
    };

    const start = () => {
        const { timeoutHandle, retryIndex } = STATE;
        if (timeoutHandle) {
            return;
        }
        const ms = INTERVAL_EVENT_TIMER * FIBONACCI[retryIndex];
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

    return {
        setEventID,
        start,
        stop,
        call,
        reset
    }
}
