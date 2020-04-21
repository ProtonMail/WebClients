import { useCache } from 'react-components';

const useQueuedFunction = () => {
    const cache = useCache();

    const queuedFunction = <R, A extends any[]>(fnKey: string, fn: (...args: A) => Promise<R>) => {
        const key = `queuedfn_${fnKey}`;

        return (...args: A) => {
            const existingPromise: Promise<R> | undefined = cache.get(key);
            if (existingPromise) {
                const promise = existingPromise.finally(() => fn(...args));
                cache.set(key, promise);
                return promise;
            }

            const promise = fn(...args);
            cache.set(key, promise);
            return promise;
        };
    };

    return queuedFunction;
};

export default useQueuedFunction;
