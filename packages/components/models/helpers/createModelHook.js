import { useCallback } from 'react';
import { useApi, useCache, useCachedResult } from 'react-components';

/**
 * Creates an async fn model hook.
 * @return {function} the created hook
 */
const createUseModelHook = ({ key, get }) => {
    return () => {
        const api = useApi();
        const cache = useCache();
        const load = useCallback(() => {
            return get(api);
        }, []);
        return useCachedResult(cache, key, load);
    };
};

export default createUseModelHook;
