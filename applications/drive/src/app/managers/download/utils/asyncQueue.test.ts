import { describe, expect, it } from '@jest/globals';

import { createAsyncQueue } from './asyncQueue';

async function collect<T>(asyncIterable: AsyncIterable<T>) {
    const result: T[] = [];
    for await (const value of asyncIterable) {
        result.push(value);
    }
    return result;
}

describe('createAsyncQueue', () => {
    it('yields values in FIFO order', async () => {
        const queue = createAsyncQueue<number>();

        queue.push(1);
        queue.push(2);
        queue.close();

        const values = await collect(queue.iterator());
        expect(values).toEqual([1, 2]);
    });

    it('propagates errors to the consumer', async () => {
        const queue = createAsyncQueue<number>();
        const error = new Error('boom');

        queue.error(error);

        await expect(collect(queue.iterator())).rejects.toThrow(error);
    });

    it('supports producers that await async work', async () => {
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
