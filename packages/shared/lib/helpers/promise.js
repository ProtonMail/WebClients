/**
 * Returns a promise that resolves after delay ms
 * @param  {Number} delay
 * @return {Promise}
 */
export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
