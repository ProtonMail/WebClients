import { useContext } from 'react';

import ContextApi from './apiContext';

const useApi = () => {
    return useContext(ContextApi);
};

export default useApi;
