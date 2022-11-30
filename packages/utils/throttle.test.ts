import throttle from './throttle';

describe('throttle()', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('invokes function at most once every wait milliseconds', () => {
        const functionToThrottle = jest.fn();
        const wait = 1000;
        const throttledFunction = throttle(functionToThrottle, wait);

        throttledFunction();
        expect(functionToThrottle).toHaveBeenCalledTimes(1);

        // Call function just before the wait time expires
        jest.advanceTimersByTime(wait - 1);
        throttledFunction();
        expect(functionToThrottle).toHaveBeenCalledTimes(1);

        // fast-forward until 1st call should be executed
        jest.advanceTimersByTime(1);
        expect(functionToThrottle).toHaveBeenCalledTimes(2);

        throttledFunction();
        expect(functionToThrottle).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(wait);
        expect(functionToThrottle).toHaveBeenCalledTimes(3);
    });
});
