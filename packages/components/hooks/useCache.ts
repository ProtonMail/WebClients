import { Cache } from 'proton-shared/lib/helpers/cache';
import { useContext } from 'react';

import Context from '../containers/cache/cacheContext';

const useCache = <K = string, V = any>() => {
    const cache = useContext(Context);

    if (!cache) {
        throw new Error('Trying to use uninitialized CacheContext');
    }

    return cache as Cache<K, V>;
};

export default useCache;
