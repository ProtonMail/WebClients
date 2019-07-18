import { useContext } from 'react';

import Context from './cacheContext';

const useCache = () => {
    return useContext(Context);
};

export default useCache;
