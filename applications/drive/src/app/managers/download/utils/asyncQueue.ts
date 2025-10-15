export type AsyncQueue<T> = {
    push(value: T): void;
    close(): void;
    error(error: unknown): void;
    iterator(): AsyncGenerator<T>;
};

type QueueItem<T> = { type: 'value'; value: T } | { type: 'error'; error: unknown } | { type: 'end' };

/**
 * Creates a simple producer/consumer queue that can be fed from one async flow
 * and iterated in another using `for await ... of`.
 *
 * Adapted from https://github.com/alanshaw/it-pushable/blob/master/src/fifo.ts
 *
 * ```ts
 * const queue = createAsyncQueue<number>();
 *
 * // creating the queue
 * (async () => {
 *     queue.push(await fetchValue());
 *     queue.push(await fetchValue());
 *     queue.close();
 * })();
 *
 * // consuming the queue
 * (async () => {
 *     for await (const value of queue.iterator()) {
 *         console.log(value);
 *     }
 * })();
 * ```
 */
export function createAsyncQueue<T>(): AsyncQueue<T> {
    const items: QueueItem<T>[] = [];
    const waiters: ((item: QueueItem<T>) => void)[] = [];
    let ended = false;

    const enqueue = (item: QueueItem<T>) => {
        if (waiters.length) {
            waiters.shift()!(item);
        } else {
            items.push(item);
        }
    };

    return {
        push(value: T) {
            if (ended) {
                return;
            }
            enqueue({ type: 'value', value });
        },
        close() {
            if (ended) {
                return;
            }
            ended = true;
            const endItem: QueueItem<T> = { type: 'end' };
            if (waiters.length) {
                while (waiters.length) {
                    waiters.shift()!(endItem);
                }
            } else {
                items.push(endItem);
            }
        },
        error(error: unknown) {
            if (ended) {
                return;
            }
            ended = true;
            const errorItem: QueueItem<T> = { type: 'error', error };
            items.length = 0;
            if (waiters.length) {
                while (waiters.length) {
                    waiters.shift()!(errorItem);
                }
            } else {
                items.push(errorItem);
            }
        },
        iterator(): AsyncGenerator<T> {
            return (async function* consume() {
                while (true) {
                    let item: QueueItem<T>;
                    if (items.length) {
                        item = items.shift()!;
                    } else {
                        item = await new Promise<QueueItem<T>>((resolve) => waiters.push(resolve));
                    }

                    if (item.type === 'value') {
                        yield item.value;
                        continue;
                    }
                    if (item.type === 'end') {
                        return;
                    }
                    throw item.error;
                }
            })();
        },
    };
}
