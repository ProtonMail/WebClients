import { updateServerTime as internalUpdateServerTime, serverTime } from 'pmcrypto-v6-canary/lib/serverTime';

let updateCalled = false;
/**
 * If `updateServerTime()` is never called, then `serverTime()` returns the device time.
 * This helpers is for debugging purposes and returns whether the serverTime is indeed being used.
 */
const wasServerTimeEverUpdated = () => updateCalled;
const updateServerTime = (serverDate: Date) => {
    updateCalled = true;
    return internalUpdateServerTime(serverDate);
};

export { serverTime, updateServerTime, wasServerTimeEverUpdated };
