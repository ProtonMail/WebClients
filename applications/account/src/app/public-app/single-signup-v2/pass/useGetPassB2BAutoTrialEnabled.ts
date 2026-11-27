import { useUnleashClient } from '@unleash/proxy-client-react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getUnleashReadyPromise } from '@proton/unleash/getUnleashReadyPromise';
import noop from '@proton/utils/noop';

/** Reads the `PassB2BSignupAutoTrial` flag; off for other apps, or if the flags failed or didn't load in time
 * (unless known from a previous visit) */
export const useGetPassB2BAutoTrialEnabled = (toApp: APP_NAMES | undefined) => {
    const unleashClient = useUnleashClient();

    return async () => {
        if (toApp !== APPS.PROTONPASS) {
            return false;
        }
        await getUnleashReadyPromise(unleashClient).catch(noop);
        return unleashClient.isEnabled('PassB2BSignupAutoTrial');
    };
};
