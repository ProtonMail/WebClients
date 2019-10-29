import { queryPremiumDomains } from 'proton-shared/lib/api/domains';

import useCachedModelResult from './useCachedModelResult';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';

const getPremiumDomains = (api) => api(queryPremiumDomains()).then(({ Domains = [] }) => Domains);

const usePremiumDomains = () => {
    const api = useApi();
    const cache = useCache();
    return useCachedModelResult(cache, 'premiumDomains', () => getPremiumDomains(api));
};

export default usePremiumDomains;
