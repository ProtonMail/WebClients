import { waitUntil } from './wait-until';

describe('waitUntil', () => {
    const TIMEOUT = 500;
    let clearIntervalSpy: jest.SpyInstance,
        clearTimeoutSpy: jest.SpyInstance,
        setIntervalSpy: jest.SpyInstance,
        setTimeoutSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        setIntervalSpy = jest.spyOn(global, 'setInterval');
        setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    });
    afterEach(() => {
        jest.clearAllTimers();
        clearIntervalSpy.mockRestore();
        clearTimeoutSpy.mockRestore();
        setIntervalSpy.mockRestore();
        setTimeoutSpy.mockRestore();
    });

    test('should resolve immediately if condition is already true', async () => {
        const checkTrue = jest.fn(() => true);
        await expect(waitUntil(checkTrue, 100, TIMEOUT)).resolves.toBeUndefined();
        expect(checkTrue).toHaveBeenCalledTimes(1);
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    test('should reject if condition is false after timeout', async () => {
        const checkFalse = jest.fn(() => false);
        const job = waitUntil(checkFalse, 100, TIMEOUT);
        expect(checkFalse).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(TIMEOUT);
        await expect(job).rejects.toBeUndefined();
        expect(checkFalse).toHaveBeenCalledTimes(5);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    test('should reject if cancel returns true', async () => {
        const checkFalse = jest.fn(() => false);
        const cancel = jest.fn(() => true);
        await expect(waitUntil({ check: checkFalse, cancel }, 100, TIMEOUT)).rejects.toBeUndefined();
        expect(checkFalse).toHaveBeenCalledTimes(0);
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    test('should resolve if condition becomes true before timeout', async () => {
        const check = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
        const job = waitUntil(check, 100, TIMEOUT);
        jest.advanceTimersByTime(TIMEOUT);
        await expect(job).resolves.toBeUndefined();
        expect(check).toHaveBeenCalledTimes(3);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    test('should call cancel and reject if cancel returns true while waiting', async () => {
        const checkFalse = jest.fn(() => false);
        const cancel = jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
        const job = waitUntil({ check: checkFalse, cancel }, 100, TIMEOUT);
        jest.advanceTimersByTime(TIMEOUT);
        await expect(job).rejects.toBeUndefined();
        expect(checkFalse).toHaveBeenCalledTimes(2);
        expect(cancel).toHaveBeenCalledTimes(3);
        expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });
});
