import { createDebouncedBuffer } from './createDebouncedBuffer';

describe('createDebouncedBuffer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should batch items and flush after debounce delay', () => {
        const flush = jest.fn();
        const { push } = createDebouncedBuffer<number>(flush, 200);

        push(1);
        push(2);
        push(3);

        expect(flush).not.toHaveBeenCalled();

        jest.advanceTimersByTime(200);

        expect(flush).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should reset the timer on each push', () => {
        const flush = jest.fn();
        const { push } = createDebouncedBuffer<number>(flush, 200);

        push(1);
        jest.advanceTimersByTime(150);
        push(2);
        jest.advanceTimersByTime(150);

        expect(flush).not.toHaveBeenCalled();

        jest.advanceTimersByTime(50);

        expect(flush).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledWith([1, 2]);
    });

    it('should flush immediately when drain is called', () => {
        const flush = jest.fn();
        const { push, drain } = createDebouncedBuffer<string>(flush, 200);

        push('a');
        push('b');

        drain();

        expect(flush).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledWith(['a', 'b']);

        jest.advanceTimersByTime(200);
        expect(flush).toHaveBeenCalledTimes(1);
    });

    it('should not call flush on drain when buffer is empty', () => {
        const flush = jest.fn();
        const { drain } = createDebouncedBuffer<number>(flush, 200);

        drain();

        expect(flush).not.toHaveBeenCalled();
    });

    it('should handle multiple flush cycles', () => {
        const flush = jest.fn();
        const { push } = createDebouncedBuffer<number>(flush, 100);

        push(1);
        jest.advanceTimersByTime(100);

        push(2);
        push(3);
        jest.advanceTimersByTime(100);

        expect(flush).toHaveBeenCalledTimes(2);
        expect(flush).toHaveBeenNthCalledWith(1, [1]);
        expect(flush).toHaveBeenNthCalledWith(2, [2, 3]);
    });

    it('should use default debounce of 200ms', () => {
        const flush = jest.fn();
        const { push } = createDebouncedBuffer<number>(flush);

        push(1);

        jest.advanceTimersByTime(199);
        expect(flush).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });
});
