import runInQueue from './runInQueue';

describe('runInQueue', () => {
    test("should execute every function and return it's result", async () => {
        let first = false;
        let second = false;
        let third = false;
        const executors = [
            () => {
                first = true;
                return Promise.resolve(1);
            },
            () => {
                second = true;
                return Promise.resolve(2);
            },
            () => {
                third = true;
                return Promise.resolve(3);
            }
        ];
        const results = await runInQueue(executors);
        expect(results).toEqual([1, 2, 3]);
        expect(first).toBeTruthy();
        expect(second).toBeTruthy();
        expect(third).toBeTruthy();
    });

    test('should return results in original order', async () => {
        const executor = (value: number) => {
            let resolve: (val: number) => void;
            const promise = new Promise<number>((_resolve) => {
                resolve = _resolve;
            });

            const run = () => resolve(value);

            return { promise, run };
        };

        const first = executor(1);
        const second = executor(2);
        const third = executor(3);
        const executors = [() => first.promise, () => second.promise, () => third.promise];

        second.run();
        const resultsPromise = runInQueue(executors);
        third.run();
        first.run();

        const results = await resultsPromise;
        expect(results).toEqual([1, 2, 3]);
    });
});
