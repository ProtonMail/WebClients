import { useContext } from 'react';

import ConfigContext from '../containers/config/configContext';

const useConfig = () => {
    return useContext(ConfigContext);
};

export default useConfig;
