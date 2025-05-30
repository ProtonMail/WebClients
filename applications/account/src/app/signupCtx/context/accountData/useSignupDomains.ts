import { useCallback, useState } from 'react';

import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import type { Api } from '@proton/shared/lib/interfaces';

import { getOptimisticDomains } from '../../../signup/helper';

export const useSignupDomains = () => {
    const [domains, setDomains] = useState(() => {
        return getOptimisticDomains();
    });

    const init = useCallback(async (api: Api) => {
        const { Domains } = await api<{ Domains: string[] }>(queryAvailableDomains('signup'));
        setDomains(Domains);
    }, []);

    return { domains, init };
};
