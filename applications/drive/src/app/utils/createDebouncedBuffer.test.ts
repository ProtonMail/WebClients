import { createDebouncedBuffer } from './createDebouncedBuffer';

describe('createDebouncedBuffer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should batch items and flush after debounce delay', () => {
        const flush = vi.fn();
        const { push } = createDebouncedBuffer<number>(flush, 200);

        push(1);
        push(2);
        push(3);

        expect(flush).not.toHaveBeenCalled();

        vi.advanceTimersByTime(200);

        expect(flush).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should reset the timer on each push', () => {
        const flush = vi.fn();
        const { push } = createDebouncedBuffer<number>(flush, 200);

        push(1);
        vi.advanceTimersByTime(150);
        push(2);
        vi.advanceTimersByTime(150);

        expect(flush).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);

        expect(flush).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledWith([1, 2]);
    });

    it('should flush immediately when drain is called', () => {
        const flush = vi.fn();
        const { push, drain } = createDebouncedBuffer<string>(flush, 200);

        push('a');
        push('b');

        drain();

        expect(flush).toHaveBeenCalledTimes(1);
        expect(flush).toHaveBeenCalledWith(['a', 'b']);

        vi.advanceTimersByTime(200);
        expect(flush).toHaveBeenCalledTimes(1);
    });

    it('should not call flush on drain when buffer is empty', () => {
        const flush = vi.fn();
        const { drain } = createDebouncedBuffer<number>(flush, 200);

        drain();

        expect(flush).not.toHaveBeenCalled();
    });

    it('should handle multiple flush cycles', () => {
        const flush = vi.fn();
        const { push } = createDebouncedBuffer<number>(flush, 100);

        push(1);
        vi.advanceTimersByTime(100);

        push(2);
        push(3);
        vi.advanceTimersByTime(100);

        expect(flush).toHaveBeenCalledTimes(2);
        expect(flush).toHaveBeenNthCalledWith(1, [1]);
        expect(flush).toHaveBeenNthCalledWith(2, [2, 3]);
    });

    it('should use default debounce of 200ms', () => {
        const flush = vi.fn();
        const { push } = createDebouncedBuffer<number>(flush);

        push(1);

        vi.advanceTimersByTime(199);
        expect(flush).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(flush).toHaveBeenCalledTimes(1);
    });
});
