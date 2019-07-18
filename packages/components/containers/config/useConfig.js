import { useContext } from 'react';

import ConfigContext from './configContext';

const useConfig = () => {
    return useContext(ConfigContext);
};

export default useConfig;
