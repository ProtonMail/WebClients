import { useCallback } from 'react';

import { queryFreePlan } from '@proton/shared/lib/api/payments';
import { Api, Currency, FreePlanDefault } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult from './useCachedModelResult';

export const KEY = 'freePlan';

export const getFreePlan = (api: Api, Currency?: Currency) =>
    api<{ Plans: FreePlanDefault }>(queryFreePlan({ Currency }))
        .then(({ Plans }) => ({
            ...Plans,
            MaxBaseSpace: Plans.MaxBaseSpace ?? Plans.MaxSpace,
            MaxDriveSpace: Plans.MaxDriveSpace ?? Plans.MaxSpace,
        }))
        .catch(() => FREE_PLAN);

/**
 * Requests available plans information
 */
const useFreePlan = (currency?: Currency): [FreePlanDefault, boolean] => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => getFreePlan(api, currency), [api, currency]);
    const [result, loading] = useCachedModelResult(cache, KEY, miss);
    return [result || FREE_PLAN, loading];
};

export default useFreePlan;
