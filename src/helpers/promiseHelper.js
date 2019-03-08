/**
 * Create cancellation token that can be used to cancel a promise to a function that supports it
 * @return {Object}
 */
export const createCancellationToken = () => {
    let token = false;
    let trigger = () => {};
    const event = new Promise((resolve) => (trigger = resolve));
    return {
        cancel(reason = '') {
            trigger(reason);
            token = true;
        },
        getCancelEvent() {
            return event;
        },
        isCancelled() {
            return token;
        },
        check() {
            if (token) {
                const error = new Error();
                error.isCancellationError = true;
                throw error;
            }
        }
    };
};

/**
 * Pause the flow for an amount of time (ms)
 * @param  {Number} delay
 * @return {Promise}
 */
export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

/**
 * Runs each chunk from a chunks array and waits after each one has run (unless it's the last one).
 * @param {Array<Array>} chunks
 * @param {function} cb
 * @param {Number} delay
 * @returns {Promise<Array>}
 */
export const runChunksDelayed = async (chunks = [], cb, delay) => {
    const promises = [];

    for (let i = 0; i < chunks.length; ++i) {
        promises.push(...chunks[i].map(cb));
        if (i !== chunks.length - 1) {
            await wait(delay);
        }
    }

    return Promise.all(promises);
};
