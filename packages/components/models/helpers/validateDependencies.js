const areDependenciesEqual = (a, b) => {
    if (!a) {
        return false;
    }
    for (let i = 0; i < a.length && i < b.length; i++) {
        if (a[i] === b[i]) {
            continue;
        }
        return false;
    }
    return true;
};

/**
 * Validates that the array of dependencies are the same based on the cache.
 * Will delete the result of the model from the cache if they are not.
 * @param {Object} cache
 * @param {String} key
 * @param {Array} nextDependencies
 */
const validateDependencies = (cache, key, nextDependencies) => {
    const depKey = `${key}-dep`;
    const prevDependencies = cache.get(depKey);
    if (!areDependenciesEqual(prevDependencies, nextDependencies)) {
        cache.delete(key);
        cache.set(depKey, nextDependencies);
    }
};

export default validateDependencies;
