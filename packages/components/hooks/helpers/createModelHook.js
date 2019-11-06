import useCachedModelResult from '../useCachedModelResult';
import useApi from '../../containers/api/useApi';
import useCache from '../../containers/cache/useCache';
import { useCallback } from 'react';

/**
 * Creates an async fn model hook.
 * @return {function} the created hook
 */
const createUseModelHook = ({ key, get }) => {
    return () => {
        const api = useApi();
        const cache = useCache();
        return useCachedModelResult(cache, key, useCallback(() => get(api), [api]));
    };
};

export default createUseModelHook;
