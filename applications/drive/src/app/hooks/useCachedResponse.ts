import { useCache } from 'react-components';
import { useState } from 'react';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';

const useCachedResponse = () => {
    const cache = useCache();
    const [, setError] = useState();

    const getCachedResponse = <R, A extends any[] = []>(
        key: string,
        missHandler: (...args: A) => Promise<R>
    ): Promise<R> => {
        return getPromiseValue(cache, key, missHandler).catch((e: Error) => {
            if (e.name === 'StatusCodeError') {
                setError(() => {
                    throw e;
                });
            }
            return Promise.reject(e);
        });
    };

    return { cache, getCachedResponse };
};

export default useCachedResponse;
