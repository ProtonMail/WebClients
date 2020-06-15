import runInQueue from './runInQueue';

describe('runInQueue', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    it('should execute every function', async () => {
        const executors = [
            jest.fn().mockResolvedValue(1),
            jest.fn().mockResolvedValue(2),
            jest.fn().mockResolvedValue(3)
        ];
        await runInQueue(executors);
        executors.forEach((executor) => {
            expect(executor).toBeCalledTimes(1);
        });
    });

    it('should execute functions using several threads and return results in original order', async () => {
        const maxThreads = 3;

        const executor = (delay: number) =>
            jest.fn().mockImplementation(
                () => new Promise<number>((resolve) => setTimeout(() => resolve(delay), delay))
            );

        const executors = [executor(200), executor(300), executor(400), executor(500), executor(100), executor(600)];
        const expectToHaveExecuted = (count: number) =>
            expect(executors.filter((fn) => fn.mock.calls.length === 1).length).toEqual(count);

        const promises = runInQueue<number>(executors, maxThreads);
        expectToHaveExecuted(3);

        const executedOnStepOf100ms = [3, 3, 4, 5, 6];
        for (let step = 0; step < executedOnStepOf100ms.length; step++) {
            expectToHaveExecuted(executedOnStepOf100ms[step]);
            jest.advanceTimersByTime(100);
            await Promise.resolve();
        }

        jest.runAllTimers();
        const results = await promises;

        expect(results).toEqual([200, 300, 400, 500, 100, 600]);
    });
});
