import { useContext } from 'react';

import Context from '../containers/cache/cacheContext';

const useCache = () => {
    return useContext(Context);
};

export default useCache;
