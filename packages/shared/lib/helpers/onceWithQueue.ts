/**
 * Ensures that a function returning a promise is only called once at a time.
 *
 * If it is called while the previous promise is resolving, another call to the
 * function will be queued, and run once, with the arguments of the last call
 * after the previous promise has resolved. The returned promise resolves after
 * the queued promise resolves.
 *
 */
export const onceWithQueue = <A extends unknown[], R>(fn: (...args: A) => Promise<R>): ((...args: A) => Promise<R>) => {
    let STATE: {
        promise?: Promise<R>;
        queued?: Promise<R>;
        queuedArgs?: A;
    } = {};

    const clear = () => {
        STATE = {};
    };

    const clearPromise = () => {
        STATE.promise = undefined;
    };

    const next = (): Promise<R> => {
        const args = STATE.queuedArgs as A;
        clear();
        // eslint-disable-next-line
        return run(...args);
    };

    const run = (...args: A) => {
        // If a queue has already been set up, update the arguments.
        if (STATE.queued) {
            STATE.queuedArgs = args;
            return STATE.queued;
        }

        // If a promise is running, set up the queue.
        if (STATE.promise) {
            STATE.queuedArgs = args;
            STATE.queued = STATE.promise.then(next);
            return STATE.queued;
        }

        // Cache the promise.
        STATE.promise = fn(...args);
        // Set up independent resolve handlers.
        STATE.promise.then(clearPromise).catch(clear);

        return STATE.promise;
    };

    return run;
};
