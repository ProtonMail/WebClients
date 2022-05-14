import buffer from './buffer';

describe('buffer()', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('invokes function at start wait interval', () => {
        const functionToBuffer = jest.fn();
        const wait = 1000;
        const bufferedFunction = buffer(functionToBuffer, wait);

        bufferedFunction();

        // Start of first interval
        expect(functionToBuffer).toHaveBeenCalledTimes(1);
    });

    it('invokes function at start and end of wait interval', () => {
        const functionToBuffer = jest.fn();
        const wait = 1000;
        const bufferedFunction = buffer(functionToBuffer, wait);

        bufferedFunction();

        // Start of first interval
        expect(functionToBuffer).toHaveBeenCalledTimes(1);

        // Call function just before the wait time expires
        jest.advanceTimersByTime(wait - 1);
        bufferedFunction();
        expect(functionToBuffer).toHaveBeenCalledTimes(1);

        // End of first interval
        jest.advanceTimersByTime(wait);
        expect(functionToBuffer).toHaveBeenCalledTimes(2);

        // Start of second interval
        jest.advanceTimersByTime(1);
        bufferedFunction();
        expect(functionToBuffer).toHaveBeenCalledTimes(3);
    });

    it('should do something', () => {
        const functionToThrottle = jest.fn();
        const wait = 1000;
        const bufferedFunction = buffer(functionToThrottle, wait);

        bufferedFunction();
    });
});
