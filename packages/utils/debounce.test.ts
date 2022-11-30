import debounce from './debounce';

describe('debounce()', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('delays invoking function until after wait time', () => {
        const functionToDebounce = jest.fn();
        const wait = 1000;
        const debouncedFunction = debounce(functionToDebounce, wait);

        debouncedFunction();
        expect(functionToDebounce).not.toHaveBeenCalled();

        // Call function again just before the wait time expires
        jest.advanceTimersByTime(wait - 1);
        debouncedFunction();
        expect(functionToDebounce).not.toHaveBeenCalled();

        // fast-forward time until 1 millisecond before the function should be invoked
        jest.advanceTimersByTime(wait - 1);
        expect(functionToDebounce).not.toHaveBeenCalled();

        // fast-forward until 1st call should be executed
        jest.advanceTimersByTime(1);
        expect(functionToDebounce).toHaveBeenCalledTimes(1);
    });

    it('does not invoke function if already invoked', () => {
        const functionToDebounce = jest.fn();
        const wait = 1000;
        const debouncedFunction = debounce(functionToDebounce, wait);

        debouncedFunction();

        jest.advanceTimersByTime(wait);
        expect(functionToDebounce).toHaveBeenCalledTimes(1);
        functionToDebounce.mockClear();

        jest.advanceTimersByTime(wait);
        expect(functionToDebounce).not.toHaveBeenCalled();
    });

    describe('options', () => {
        describe('immediate', () => {
            it('defaults to false and does not invoke function immediately', () => {
                const functionToDebounce = jest.fn();
                const wait = 1000;
                const debouncedFunction = debounce(functionToDebounce, wait);

                debouncedFunction();
                expect(functionToDebounce).not.toHaveBeenCalled();
            });

            it('invokes function immediately if true', () => {
                const functionToDebounce = jest.fn();
                const wait = 1000;
                const debouncedFunction = debounce(functionToDebounce, wait, { leading: true });

                debouncedFunction();
                expect(functionToDebounce).toHaveBeenCalled();
            });
        });
    });

    describe('abort()', () => {
        it('does not invoke function if abort is called before wait time expires', () => {
            const functionToDebounce = jest.fn();
            const wait = 1000;
            const debouncedFunction = debounce(functionToDebounce, wait);

            debouncedFunction();

            // Call function again just before the wait time expires
            jest.advanceTimersByTime(wait - 1);
            debouncedFunction.cancel();

            // fast-forward until 1st call should be executed
            jest.advanceTimersByTime(1);
            expect(functionToDebounce).not.toHaveBeenCalled();
        });
    });
});
