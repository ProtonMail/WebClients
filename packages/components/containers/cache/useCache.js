import { useContext } from 'react';

import Context from './CacheContext';

const useCache = () => {
    return useContext(Context);
};

export default useCache;
