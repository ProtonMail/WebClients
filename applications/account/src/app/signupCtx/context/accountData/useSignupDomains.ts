import { useCallback, useState } from 'react';

import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import type { Api } from '@proton/shared/lib/interfaces';

import { getOptimisticDomains } from '../../../signup/helper';

export const useSignupDomains = () => {
    const [domains, setDomains] = useState(() => {
        return getOptimisticDomains();
    });
    const [domainsLoaded, setDomainsLoaded] = useState(false);

    const init = useCallback(async (api: Api) => {
        try {
            const { Domains } = await api<{ Domains: string[] }>(queryAvailableDomains('signup'));
            setDomains(Domains);
        } finally {
            setDomainsLoaded(true);
        }
    }, []);

    return { domains, domainsLoaded, init };
};
