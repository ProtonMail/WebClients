/**
 * Ensures that a function returning a promise is only called once at a time.
 *
 * If it is called while the previous promise is resolving, another call to the
 * function will be queued, and run once, with the arguments of the last call
 * after the previous promise has resolved. The returned promise resolves after
 * the queued promise resolves.
 *
 */
export const onceWithQueue = <R>(fn: () => Promise<R>): (() => Promise<R>) => {
    let STATE: {
        promise?: Promise<R>;
        queued?: Promise<R>;
    } = {};

    const clear = () => {
        STATE = {};
    };

    const clearPromise = () => {
        STATE.promise = undefined;
    };

    const next = (): Promise<R> => {
        clear();
        // eslint-disable-next-line
        return run();
    };

    const run = () => {
        // If a queue has already been set up, update the arguments.
        if (STATE.queued) {
            return STATE.queued;
        }

        // If a promise is running, set up the queue.
        if (STATE.promise) {
            STATE.queued = STATE.promise.then(next);
            return STATE.queued;
        }

        // Cache the promise.
        STATE.promise = fn();
        // Set up independent resolve handlers.
        STATE.promise.then(clearPromise).catch(clear);

        return STATE.promise;
    };

    return run;
};
