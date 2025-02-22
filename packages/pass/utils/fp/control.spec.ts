import { debounceBuffer } from './control';

describe('`debounceBuffer`', () => {
    beforeAll(() => jest.useFakeTimers());
    afterAll(() => jest.useRealTimers());
    afterEach(() => jest.clearAllTimers());

    test('should accumulate params and call effect after debounce period', () => {
        const effect = jest.fn();
        const accept = (x: number) => x * 2;
        const bufferedFn = debounceBuffer(effect, accept, 100, {});

        bufferedFn(1);
        bufferedFn(2);
        bufferedFn(3);

        expect(effect).not.toHaveBeenCalled();
        jest.advanceTimersByTime(100);
        expect(effect).toHaveBeenCalledWith([2, 4, 6]);
        expect(effect).toHaveBeenCalledTimes(1);
    });

    test('should deduplicate referentially equal values', () => {
        const effect = jest.fn();
        const accept = (x: number) => x;
        const bufferedFn = debounceBuffer(effect, accept, 100, {});

        bufferedFn(1);
        bufferedFn(2);
        bufferedFn(1);

        expect(effect).not.toHaveBeenCalled();
        jest.advanceTimersByTime(100);
        expect(effect).toHaveBeenCalledWith([1, 2]);
    });

    test('should reject parameters when accept returns false', () => {
        const effect = jest.fn();
        const accept = (x: number) => (x > 5 ? x : false);
        const bufferedFn = debounceBuffer(effect, accept, 100, {});

        bufferedFn(3);
        bufferedFn(6);
        bufferedFn(4);
        bufferedFn(7);

        expect(effect).not.toHaveBeenCalled();
        jest.advanceTimersByTime(100);
        expect(effect).toHaveBeenCalledWith([6, 7]);
    });

    test('should flush immediately when reaching `flushThreshold`', () => {
        const effect = jest.fn();
        const accept = (x: number) => x;
        const bufferedFn = debounceBuffer(effect, accept, 100, { flushThreshold: 3 });

        bufferedFn(1);
        bufferedFn(2);
        expect(effect).not.toHaveBeenCalled();

        bufferedFn(3);
        expect(effect).toHaveBeenCalledWith([1, 2, 3]);

        bufferedFn(4);
        bufferedFn(5);
        expect(effect).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(100);
        expect(effect).toHaveBeenCalledWith([4, 5]);
        expect(effect).toHaveBeenCalledTimes(2);
    });

    test('should handle manual flush call', () => {
        const effect = jest.fn();
        const accept = (x: number) => x;
        const bufferedFn = debounceBuffer(effect, accept, 100, {});

        bufferedFn(1);
        bufferedFn(2);

        expect(effect).not.toHaveBeenCalled();

        bufferedFn.flush();
        expect(effect).toHaveBeenCalledWith([1, 2]);

        bufferedFn(3);
        expect(effect).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(100);
        expect(effect).toHaveBeenCalledWith([3]);
        expect(effect).toHaveBeenCalledTimes(2);
    });

    test('should handle cancel call and clear buffer', () => {
        const effect = jest.fn();
        const accept = (x: number) => x;
        const bufferedFn = debounceBuffer(effect, accept, 100, {});

        bufferedFn(1);
        bufferedFn(2);

        bufferedFn.cancel();
        jest.advanceTimersByTime(100);
        expect(effect).not.toHaveBeenCalled();

        bufferedFn(3);
        bufferedFn(4);
        expect(effect).not.toHaveBeenCalled();

        jest.advanceTimersByTime(100);
        expect(effect).toHaveBeenCalledWith([3, 4]);
    });

    test('should not call effect when accumulator is empty', () => {
        const effect = jest.fn();
        const accept = () => false;
        const bufferedFn = debounceBuffer(effect, accept, 100, {});

        bufferedFn(1);
        bufferedFn(2);

        jest.advanceTimersByTime(100);
        expect(effect).not.toHaveBeenCalled();
    });
});
