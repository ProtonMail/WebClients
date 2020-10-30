import { useContext } from 'react';

import ContextApi from '../containers/api/apiStatusContext';

const useApiStatus = () => {
    return useContext(ContextApi);
};

export default useApiStatus;
