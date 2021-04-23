import runInQueue from '../../lib/helpers/runInQueue';
import { wait } from '../../lib/helpers/promise';

describe('runInQueue', () => {
    it('should execute every function', async () => {
        const executors = [
            jasmine.createSpy().and.resolveTo(1),
            jasmine.createSpy().and.resolveTo(2),
            jasmine.createSpy().and.resolveTo(3),
        ];
        await runInQueue(executors);
        executors.forEach((executor) => {
            expect(executor).toHaveBeenCalledTimes(1);
        });
    });

    it('should execute functions using several threads and return results in original order', async () => {
        const maxThreads = 3;

        const getExecutor = (delay: number) =>
            jasmine.createSpy().and.callFake(() => {
                return new Promise<number>((resolve) => setTimeout(() => resolve(delay), delay));
            });

        const executors = [
            getExecutor(200),
            getExecutor(300),
            getExecutor(400),
            getExecutor(500),
            getExecutor(100),
            getExecutor(600),
        ];
        const expectToHaveExecuted = (count: number) =>
            expect(executors.filter((fn) => fn.calls.all().length === 1).length).toEqual(count);

        const promises = runInQueue<number>(executors, maxThreads);
        expectToHaveExecuted(3);

        const executedOnStepOf100ms = [3, 3, 4, 5, 6];
        for (const executionCount of executedOnStepOf100ms) {
            expectToHaveExecuted(executionCount);
            await wait(100);
        }

        const results = await promises;

        expect(results).toEqual([200, 300, 400, 500, 100, 600]);
    });
});
