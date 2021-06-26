import { useCallback } from 'react';
import { queryPlans } from '@proton/shared/lib/api/payments';
import { Api, Plan } from '@proton/shared/lib/interfaces';

import useCachedModelResult from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

const KEY = 'plans';

const getPlans = (api: Api, Currency?: string) =>
    api<{ Plans: Plan[] }>(queryPlans({ Currency })).then(({ Plans }) => Plans);

/**
 * Requests available plans information
 */
const usePlans = (currency?: string): [Plan[] | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getPlans(api, currency), [api, currency]);
    return useCachedModelResult(cache, KEY, miss);
};

export default usePlans;
