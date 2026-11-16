import noop from '@proton/utils/noop';

/**
 * Requests that change elements (mark as read, label, delete...) still in flight. An event loop
 * call triggered by a ping while one of them runs can return an intermediate state, which then
 * overrides the optimistic update, e.g. a conversation marked as read and trashed reappearing.
 * Pings wait for these requests to settle before calling the event loop.
 *
 * This is a stopgap that covers most cases rather than a definitive fix.
 */
const pendingActions = new Map<number, Promise<unknown>>();
let nextID = 0;

/** Tracks the promise until it settles, and returns it untouched. */
export const trackPendingAction = <T>(promise: Promise<T>): Promise<T> => {
    const id = nextID++;
    const tracked = promise.finally(() => {
        pendingActions.delete(id);
    });
    // The rejection is the caller's to handle, through the promise it got back.
    tracked.catch(noop);
    pendingActions.set(id, tracked);
    return promise;
};

/**
 * Resolves once no tracked action is pending anymore, including actions started while waiting.
 * Never rejects, whatever the outcome of the actions.
 */
export const waitForPendingActions = async () => {
    while (pendingActions.size) {
        await Promise.allSettled(pendingActions.values());
    }
};
