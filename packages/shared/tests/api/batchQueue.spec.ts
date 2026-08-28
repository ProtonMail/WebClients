import { BatchQueue } from '../../lib/helpers/batchQueue';

describe('BatchQueue', () => {
    it('should be able to add items to the queue and flush them automatically', async () => {
        vi.useFakeTimers();
        const fakeCallback = vi.fn();
        const queue = new BatchQueue<number>({
            batchSize: 5,
            flushCallback: fakeCallback,
            flushIntervalMs: 500,
        });

        queue.add(1);
        queue.add(2);
        queue.add(3);
        queue.add(4);
        queue.add(5);

        expect(fakeCallback).toHaveBeenCalledTimes(1);
        expect(fakeCallback).toHaveBeenCalledWith([1, 2, 3, 4, 5]);

        queue.add(6);

        vi.advanceTimersByTime(510);

        expect(fakeCallback).toHaveBeenCalledTimes(2);
        expect(fakeCallback).toHaveBeenCalledWith([6]);

        vi.useRealTimers();
    });

    it('should handle synchronous errors in the flush callback', () => {
        const fakeCallback = vi.fn(() => {
            throw new Error('test');
        });
        const queue = new BatchQueue<number>({
            batchSize: 5,
            flushCallback: fakeCallback,
            flushIntervalMs: 500,
        });
        vi.spyOn(queue, 'flush');

        queue.add(1);

        expect(() => queue.flush()).not.toThrow();

        expect(fakeCallback).toHaveBeenCalledTimes(1);
        expect(fakeCallback).toThrow('test');
    });

    it('should handle asynchronous errors in the flush callback', async () => {
        const fakeError = new Error('test');

        const fakeCallback = vi.fn().mockReturnValue(Promise.reject(fakeError));
        const queue = new BatchQueue<number>({
            batchSize: 5,
            flushCallback: fakeCallback,
            flushIntervalMs: 500,
        });
        vi.spyOn(queue, 'flush');

        queue.add(1);

        expect(() => queue.flush()).not.toThrow();

        expect(fakeCallback).toHaveBeenCalledTimes(1);
        await expect(fakeCallback()).rejects.toEqual(fakeError);
    });
});
