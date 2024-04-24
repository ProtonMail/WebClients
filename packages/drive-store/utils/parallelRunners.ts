import runInQueue from '@proton/shared/lib/helpers/runInQueue';

export const DEFAULT_PARALLEL_CALL_LIMIT = 5;

export function createAsyncQueue<T>(parallelCallLimit: number = DEFAULT_PARALLEL_CALL_LIMIT) {
    const queue: (() => Promise<T>)[] = [];
    let currentLoad = 0;

    const run = () => {
        if (queue.length === 0 || currentLoad >= parallelCallLimit) {
            return;
        }

        currentLoad += 1;
        const nextTask = queue.shift();

        nextTask!()
            .catch((e: Error) => {
                console.warn(e);
            })
            .finally(() => {
                currentLoad -= 1;
                run();
            });
    };

    const addToQueue = (task: () => Promise<T>) => {
        queue.push(task);
        run();
    };

    const clearQueue = () => {
        queue.length = 0;
    };

    return {
        addToQueue,
        clearQueue,
    };
}

export function runInQueueAbortable<T extends () => Promise<R>, R>(
    tasks: T[],
    parallelCallLimit: number = DEFAULT_PARALLEL_CALL_LIMIT,
    signal?: AbortSignal
) {
    const result = runInQueue(tasks, parallelCallLimit);

    signal?.addEventListener('abort', () => {
        tasks.length = 0;
    });

    return result;
}
