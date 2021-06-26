import { useCache, useApi } from '@proton/components';
import { Api } from '@proton/shared/lib/interfaces';

const useDebouncedRequest = () => {
    const api = useApi();
    const cache = useCache();

    /**
     * If promise is pending, returns it, otherwise executes query function
     */
    const debouncedRequest: Api = <T>(args: object) => {
        const key = `request_${JSON.stringify(args)}`;
        const existingPromise: Promise<T> | undefined = cache.get(key);

        if (existingPromise) {
            return existingPromise;
        }

        const promise = api<T>(args);
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
