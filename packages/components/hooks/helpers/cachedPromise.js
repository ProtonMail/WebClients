/**
 * Cache a promise by a key, and re-run it when the dependency changes.
 * @param {Map} cache
 * @param {String} key
 * @param {Function} miss
 * @param {any} dependency
 * @return {Promise}
 */
export const cachedPromise = (cache, key, miss, dependency) => {
    if (cache.has(key)) {
        const { dependency: oldDependency, promise, result } = cache.get(key);

        if (dependency === oldDependency) {
            return promise || Promise.resolve(result);
        }
    }

    const promise = miss();

    cache.set(key, {
        dependency: dependency,
        promise,
    });

    promise.then((result) => {
        const { promise: oldPromise } = cache.get(key);

        if (promise !== oldPromise) {
            return result;
        }

        cache.set(key, {
            dependency,
            result,
        });

        return result;
    });

    return promise;
};
