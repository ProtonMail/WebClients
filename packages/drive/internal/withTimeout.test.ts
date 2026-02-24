import { withTimeout } from './withTimeout';

describe('withTimeout', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        void jest.runAllTimersAsync();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should call the promise and return its result', async () => {
        const { callWithTimeout } = withTimeout(1000);
        const result = await callWithTimeout(Promise.resolve('result'));
        expect(result).toBe('result');
    });

    it('should throw TimeoutError on timeout', async () => {
        const { signalWithTimeout, callWithTimeout } = withTimeout(1000);

        const promise = callWithTimeout(
            new Promise<string>((resolve, reject) =>
                setTimeout(() => {
                    // Simulate the promise was aborted by the signal.
                    if (signalWithTimeout.aborted) {
                        return reject(Error('Promise aborted'));
                    }
                    resolve('result');
                }, 2000)
            )
        );

        jest.advanceTimersByTime(1000);

        await expect(promise).rejects.toThrow('Request timed out');
    });

    it('should abort when the original signal is aborted', async () => {
        const controller = new AbortController();
        const { signalWithTimeout, callWithTimeout } = withTimeout(1000, controller.signal);

        const promise = callWithTimeout(
            new Promise<string>((resolve, reject) =>
                setTimeout(() => {
                    // Simulate the promise was aborted by the signal.
                    reject(Error('Promise aborted'));
                }, 2000)
            )
        );

        controller.abort();

        jest.advanceTimersByTime(2000);

        expect(signalWithTimeout.aborted).toBe(true);
        await expect(promise).rejects.toThrow('Promise aborted');
    });
});
