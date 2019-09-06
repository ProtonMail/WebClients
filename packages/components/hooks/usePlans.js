import { queryPlans } from 'proton-shared/lib/api/payments';

import useCachedModelResult from './useCachedModelResult';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';

const KEY = 'plans';

const getPlans = (api, Currency) => api(queryPlans({ Currency })).then(({ Plans }) => Plans);

/**
 * Requests available plans information
 * @param {*=} currency Currency to use for the request, if empty - it's selected based on IP
 */
const usePlans = (currency) => {
    const api = useApi();
    const cache = useCache();
    return useCachedModelResult(cache, KEY, () => getPlans(api, currency));
};

export default usePlans;
