import { useCallback } from 'react';

import { useUnleashClient } from '@unleash/proxy-client-react';

import type { FeatureFlag } from './UnleashFeatureFlags';

export const useGetFlag = () => {
    const unleashClient = useUnleashClient();
    return useCallback((flag: FeatureFlag) => {
        return unleashClient.isEnabled(flag);
    }, []);
};

export default useGetFlag;
