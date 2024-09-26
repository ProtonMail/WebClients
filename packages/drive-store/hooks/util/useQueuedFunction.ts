import useCache from '@proton/components/hooks/useCache';
import noop from '@proton/utils/noop';

type FunctionQueue<R> = [number, (() => Promise<R>)[]];

/**
 * Puts function execution into a queue with a threshold of maximum active functions processing at once
 */
const useQueuedFunction = () => {
    const cache = useCache();

    const queuedFunction = <R, A extends any[]>(fnKey: string, fn: (...args: A) => Promise<R>, threshold = 1) => {
        const key = `queuedfn_${fnKey}`;

        if (!cache.has(key)) {
            cache.set(key, [0, []]);
        }

        const runNextQueued = () => {
            const [processing, queued]: FunctionQueue<R> = cache.get(key);

            if (queued.length) {
                const [next, ...remaining] = queued;
                next().catch(noop).finally(runNextQueued);
                cache.set(key, [processing, remaining]);
            } else {
                cache.set(key, [processing - 1, []]);
            }
        };

        const run = (...args: A) => {
            const [processing, queued]: FunctionQueue<R> = cache.get(key);
            cache.set(key, [processing + 1, queued]);
            const promise = fn(...args);
            promise.catch(noop).finally(runNextQueued);
            return promise;
        };

        const enqueue = (...args: A) =>
            new Promise<R>((resolve) => {
                const [processing, queued]: FunctionQueue<R> = cache.get(key);
                cache.set(key, [
                    processing,
                    [
                        ...queued,
                        () => {
                            const promise = fn(...args);
                            resolve(promise);
                            return promise;
                        },
                    ],
                ]);
            });

        return (...args: A) => {
            const [processing]: FunctionQueue<R> = cache.get(key);
            return processing < threshold ? run(...args) : enqueue(...args);
        };
    };

    return queuedFunction;
};

export default useQueuedFunction;
