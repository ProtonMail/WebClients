import { useContext } from 'react';

import Context from './PromiseCacheContext';

const usePromiseCache = () => {
    return useContext(Context);
};

export default usePromiseCache;
