import type { MockInstance } from 'vitest';

import { waitUntil } from './wait-until';

describe('waitUntil', () => {
    const TIMEOUT = 500;
    let clearIntervalSpy: MockInstance,
        clearTimeoutSpy: MockInstance,
        setIntervalSpy: MockInstance,
        setTimeoutSpy: MockInstance;

    beforeEach(() => {
        vi.useFakeTimers();
        clearIntervalSpy = vi.spyOn(global, 'clearInterval');
        clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
        setIntervalSpy = vi.spyOn(global, 'setInterval');
        setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    });
    afterEach(() => {
        vi.clearAllTimers();
        clearIntervalSpy.mockRestore();
        clearTimeoutSpy.mockRestore();
        setIntervalSpy.mockRestore();
        setTimeoutSpy.mockRestore();
    });

    test('should resolve immediately if condition is already true', async () => {
        const checkTrue = vi.fn(() => true);
        await expect(waitUntil(checkTrue, 100, TIMEOUT)).resolves.toBeUndefined();
        expect(checkTrue).toHaveBeenCalledTimes(1);
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    test('should reject if condition is false after timeout', async () => {
        const checkFalse = vi.fn(() => false);
        const job = waitUntil(checkFalse, 100, TIMEOUT);
        expect(checkFalse).toHaveBeenCalledTimes(1);
        const assertion = expect(job).rejects.toStrictEqual(new Error('Timeout'));
        await vi.advanceTimersByTimeAsync(TIMEOUT);
        await assertion;
        expect(checkFalse).toHaveBeenCalledTimes(5);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

        await vi.runAllTimersAsync();
    });

    test('should reject if cancel returns true', async () => {
        const checkFalse = vi.fn(() => false);
        const cancel = vi.fn(() => true);
        await expect(waitUntil({ check: checkFalse, cancel }, 100, TIMEOUT)).rejects.toStrictEqual(
            new Error('Canceled')
        );
        expect(checkFalse).toHaveBeenCalledTimes(0);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    test('should resolve if condition becomes true before timeout', async () => {
        const check = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
        const job = waitUntil(check, 100, TIMEOUT);
        await vi.advanceTimersByTimeAsync(TIMEOUT);
        await expect(job).resolves.toBe(undefined);
        expect(check).toHaveBeenCalledTimes(3);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    test('should call cancel and reject if cancel returns true while waiting', async () => {
        const checkFalse = vi.fn(() => false);
        const cancel = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
        const job = waitUntil({ check: checkFalse, cancel }, 100, TIMEOUT);
        const assertion = expect(job).rejects.toStrictEqual(new Error('Canceled'));
        await vi.advanceTimersByTimeAsync(TIMEOUT);
        await assertion;
        expect(checkFalse).toHaveBeenCalledTimes(2);
        expect(cancel).toHaveBeenCalledTimes(3);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
        await vi.runAllTimersAsync();
    });
});
