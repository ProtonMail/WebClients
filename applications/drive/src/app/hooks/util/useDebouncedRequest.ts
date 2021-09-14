import { useCache, useApi } from '@proton/components';

const useDebouncedRequest = () => {
    const api = useApi();
    const cache = useCache();

    /**
     * If promise is pending, returns it, otherwise executes query function
     */
    const debouncedRequest = <T>(args: object, signal?: AbortSignal) => {
        const key = `request_${JSON.stringify(args)}`;
        const existingPromise: Promise<T> | undefined = cache.get(key);

        if (existingPromise) {
            return existingPromise;
        }

        const promise = api<T>({ signal, ...args });
        cache.set(key, promise);

        const cleanup = () => {
            cache.delete(key);
        };
        promise.then(cleanup).catch(cleanup);
        return promise;
    };

    return debouncedRequest;
};

export default useDebouncedRequest;
