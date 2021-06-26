import { useContext } from 'react';

import Context from '../containers/forceRefresh/context';

const useForceRefresh = () => {
    return useContext(Context);
};

export default useForceRefresh;
