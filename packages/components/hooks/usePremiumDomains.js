import { queryPremiumDomains } from '@proton/shared/lib/api/domains';

import { useCallback } from 'react';
import useCachedModelResult from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

const getPremiumDomains = (api) => api(queryPremiumDomains()).then(({ Domains = [] }) => Domains);

const usePremiumDomains = () => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getPremiumDomains(api), [api]);
    return useCachedModelResult(cache, 'premiumDomains', miss);
};

export default usePremiumDomains;
