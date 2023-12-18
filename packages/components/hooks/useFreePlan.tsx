import { useCallback } from 'react';

import { queryFreePlan } from '@proton/shared/lib/api/payments';
import { Api, Currency, FreePlanDefault } from '@proton/shared/lib/interfaces';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

export const KEY = 'freePlan';

const getFreePlan = (api: Api, Currency?: Currency) =>
    api<{ Plans: FreePlanDefault }>(queryFreePlan({ Currency })).then(({ Plans }) => Plans);

/**
 * Requests available plans information
 */
const useFreePlan = (currency?: Currency): [FreePlanDefault | undefined, boolean, Error] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getFreePlan(api, currency), [api, currency]);
    return useCachedModelResult(cache, KEY, miss);
};

export default useFreePlan;
