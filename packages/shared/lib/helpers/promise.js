/**
 * Ensures that a function returning a promise is only called once at a time.
 *
 * If it is called while the previous promise is resolving, another call to the
 * function will be queued, and run once, with the arguments of the last call
 * after the previous promise has resolved. The returned promise resolves after
 * the queued promise resolves.
 *
 * @param {Function} fn
 * @return {Function}
 */
export const onceWithQueue = (fn) => {
    let STATE = {};

    const clear = () => STATE = {};

    const clearPromise = () => STATE.promise = undefined;

    const next = () => {
        const { args } = STATE;
        clear();
        return run(...args);
    };

    const run = (...args) => {
        // If a queue has already been set up, update the arguments.
        if (STATE.queued) {
            STATE.args = args;
            return STATE.queued;
        }

        // If a promise is running, set up the queue.
        if (STATE.promise) {
            STATE.args = args;
            return STATE.queued = STATE.promise
                .then(next);
        }

        // Cache the promise.
        STATE.promise = fn();
        // Set up independent resolve handlers.
        STATE.promise
            .then(clearPromise)
            .catch(clear);

        return STATE.promise;
    };

    return run;
};
