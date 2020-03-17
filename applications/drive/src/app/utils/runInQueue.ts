async function runInQueue<T>(queue: ((index: number) => Promise<T>)[], maxProcessing: number): Promise<T[]> {
    const results: T[] = [];
    let resultIndex = 0;

    const runNext = (): Promise<any> => {
        const executor = queue.shift();
        const index = resultIndex;
        resultIndex += 1;

        if (executor) {
            return executor(index).then((result) => {
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
