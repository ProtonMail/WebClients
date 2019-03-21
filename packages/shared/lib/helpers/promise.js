/**
 * Returns a promise that resolves after delay ms
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
