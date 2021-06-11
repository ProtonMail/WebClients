import { useContext } from 'react';

import ContextApi from '../containers/api/apiServerTimeContext';

const useApiServerTime = () => {
    return useContext(ContextApi);
};

export default useApiServerTime;
