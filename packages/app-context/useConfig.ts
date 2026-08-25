import { useContext } from 'react';

import { ConfigContext } from './configContext';

export const useConfig = () => {
    return useContext(ConfigContext);
};
