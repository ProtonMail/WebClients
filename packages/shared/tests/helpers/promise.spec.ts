import { createPromise, promiseWithTimeout, runChunksDelayed, wait } from '../../lib/helpers/promise';

describe('promise', () => {
    describe('chunks delayed', () => {
        it('should call chunks in a specific interval', async () => {
            const chunks = [
                [1, 2],
                [3, 4],
            ];
            const resultMap: Record<number, string> = {
                1: 'foo',
                2: 'bar',
                3: 'baz',
                4: 'qux',
            };
            const cb = async (value: number) => {
                return resultMap[value];
            };
            const spy = vi.fn(cb);
            const promise = runChunksDelayed(chunks, spy, 100);
            await wait(80);
            expect(spy.mock.calls.length).toEqual(2);
            const result = await promise;
            expect(spy.mock.calls.length).toEqual(4);
            expect(result).toEqual(['foo', 'bar', 'baz', 'qux']);
        });
    });

    describe('promiseWithTimeout', () => {
        it('should resolve with the value of a promise that settles in time', async () => {
            await expect(promiseWithTimeout({ promise: Promise.resolve('value'), timeoutMs: 1000 })).resolves.toBe(
                'value'
            );
        });

        it('should reject with the error message when the promise does not settle in time', async () => {
            const promise = new Promise(() => {});

            await expect(promiseWithTimeout({ promise, timeoutMs: 1, errorMessage: 'Too slow' })).rejects.toThrow(
                'Too slow'
            );
        });

        it('should not leave an unhandled rejection when the promise rejects after the timeout', async () => {
            const unhandledRejection = vi.fn();
            window.addEventListener('unhandledrejection', unhandledRejection);
            const { promise, reject } = createPromise();

            await expect(promiseWithTimeout({ promise, timeoutMs: 1 })).rejects.toThrow('Promise timed out');
            reject(new Error('Operation aborted'));
            await wait(50);
            window.removeEventListener('unhandledrejection', unhandledRejection);

            expect(unhandledRejection).not.toHaveBeenCalled();
        });
    });
});
