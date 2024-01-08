import { useCallback } from 'react';

import { queryAvailableDomains, queryPremiumDomains } from '@proton/shared/lib/api/domains';
import { Api } from '@proton/shared/lib/interfaces';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const getDomains = async (api: Api) => {
    const [premiumDomains, protonDomains] = await Promise.all([
        api(queryPremiumDomains()).then(({ Domains = [] }) => Domains),
        api(queryAvailableDomains()).then(({ Domains = [] }) => Domains),
    ]);
    return {
        premiumDomains,
        protonDomains,
    };
};

const useProtonDomains = (): [{ premiumDomains: string[]; protonDomains: string[] }, boolean] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getDomains(api), [api]);
    const [value, loading] = useCachedModelResult(cache, 'domains', miss);
    return [{ premiumDomains: value?.premiumDomains || [], protonDomains: value?.protonDomains || [] }, loading];
};

export default useProtonDomains;
