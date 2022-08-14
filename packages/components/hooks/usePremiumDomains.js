import { useCallback } from 'react';

import { queryPremiumDomains } from '@proton/shared/lib/api/domains';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

const getPremiumDomains = (api) => api(queryPremiumDomains()).then(({ Domains = [] }) => Domains);

const usePremiumDomains = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getPremiumDomains(api), [api]);
    return useCachedModelResult(cache, 'premiumDomains', miss);
};

export default usePremiumDomains;
