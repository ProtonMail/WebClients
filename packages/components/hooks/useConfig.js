import { useContext } from 'react';

import ContextConfig from '../context/config';

const useConfig = () => {
    return useContext(ContextConfig);
};

export default useConfig;
