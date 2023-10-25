import { useContext } from 'react';

import ConfigContext from '@proton/components/containers/config/configContext';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

type PassConfig = ProtonConfig & { SSO_URL: string };

const usePassConfig = () => {
    return useContext(ConfigContext) as PassConfig;
};

export default usePassConfig;
