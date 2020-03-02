async function runInQueue<T>(queue: (() => Promise<T>)[], maxProcessing = 1): Promise<T[]> {
    const results: T[] = [];

    const runNext = (): Promise<any> => {
        const executor = queue.shift();
        const index = results.length;

        if (executor) {
            return executor().then((result) => {
                results[index] = result;
                return runNext();
            });
        }
        return Promise.resolve();
    };

    const promises: Promise<any>[] = [];
    for (let i = 0; i < maxProcessing; i++) {
        promises.push(runNext());
    }
    await Promise.all(promises);

    return results;
}

export default runInQueue;
