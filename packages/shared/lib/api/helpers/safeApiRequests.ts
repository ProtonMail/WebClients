/**
 * Process multiple requests involving API calls safely to avoid getting jailed
 */
export const processApiRequestsSafe = <T>(
    promisesGenerators: (() => Promise<T>)[],
    maxConcurrentPerInterval = 10,
    intervalInMilliseconds = 1000
): Promise<T[]> => {
    const queue = [...promisesGenerators];
    let results: Promise<T>[] = [];

    return new Promise((resolve) => {
        const run = () => {
            const callbacks = queue.splice(0, maxConcurrentPerInterval);
            const promises = callbacks.map((cb) => cb());
            results = results.concat(promises);
            if (queue.length) {
                setTimeout(run, intervalInMilliseconds);
            } else {
                resolve(Promise.all(results));
            }
        };
        run();
    });
};
