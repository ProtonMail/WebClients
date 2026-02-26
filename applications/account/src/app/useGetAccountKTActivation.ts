import { useCallback } from 'react';

import { getKTActivationValueFromFlags } from '@proton/key-transparency/helpers';
import { APPS } from '@proton/shared/lib/constants';
import { useUnleashClient } from '@proton/unleash';
import { getUnleashReadyPromise } from '@proton/unleash/readyPromise';
import noop from '@proton/utils/noop';

/**
 * This is a special kt activation hook just intended for the account app since it doesn't use redux in the public app,
 * and because unleash is initiated dynamically so there's no clear entry point to get the kt state.
 */
export const useGetAccountKTActivation = () => {
    const unleashClient = useUnleashClient();

    return useCallback(async () => {
        // This ensures unleash is fetched and ready, since we are loading it dynamically it may not be ready in effect hooks
        await getUnleashReadyPromise(unleashClient).catch(noop);
        const logOnly = unleashClient.isEnabled('KeyTransparencyLogOnly');
        const showUI = unleashClient.isEnabled('KeyTransparencyShowUI');
        return getKTActivationValueFromFlags({
            logOnly,
            showUI,
            appName: APPS.PROTONACCOUNT,
        });
    }, []);
};
