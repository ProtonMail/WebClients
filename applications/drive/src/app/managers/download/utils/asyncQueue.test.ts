import { createAsyncQueue } from './asyncQueue';

async function collect<T>(asyncIterable: AsyncIterable<T>) {
    const result: T[] = [];
    for await (const value of asyncIterable) {
        result.push(value);
    }
    return result;
}

describe('createAsyncQueue', () => {
    it('should yield values in FIFO order', async () => {
        const queue = createAsyncQueue<number>();

        queue.push(1);
        queue.push(2);
        queue.close();

        const values = await collect(queue.iterator());
        expect(values).toEqual([1, 2]);
    });

    it('should propagate errors to the consumer', async () => {
        const queue = createAsyncQueue<number>();
        const error = new Error('boom');

        queue.error(error);

        await expect(collect(queue.iterator())).rejects.toThrow(error);
    });

    it('should support producers that await async work', async () => {
        const queue = createAsyncQueue<number>();

        void (async () => {
            queue.push(await Promise.resolve(1));
            queue.push(await Promise.resolve(2));
            queue.close();
        })();

        const values = await collect(queue.iterator());
        expect(values).toEqual([1, 2]);
    });
});
