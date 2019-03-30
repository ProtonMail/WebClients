import { useContext } from 'react';

import ContextApi from '../context/api';

const useApi = () => {
    return useContext(ContextApi);
};

export default useApi;
