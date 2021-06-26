import { useCallback } from 'react';
import { Api } from '@proton/shared/lib/interfaces';
import useCachedModelResult from '../useCachedModelResult';
import useApi from '../useApi';
import useCache from '../useCache';

/**
 * Creates an async fn model hook.
 */
const createUseModelHook = <T>({ key, get }: { key: string; get: (api: Api) => void }): (() => [T, boolean, Error]) => {
    return () => {
        const api = useApi();
        const cache = useCache();
        return useCachedModelResult(
            cache,
            key,
            useCallback(() => get(api), [api])
        );
    };
};

export default createUseModelHook;
