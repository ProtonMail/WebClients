import { useContext } from 'react';

import Context from './context';

const useForceRefresh = () => {
    return useContext(Context);
};

export default useForceRefresh;
