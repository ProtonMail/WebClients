import { useCallback } from 'react';
import { useCachedResult, useApi, useCache } from 'react-components';
import { queryPlans } from 'proton-shared/lib/api/payments';
import { CYCLE } from 'proton-shared/lib/constants';

const { MONTHLY } = CYCLE;
const KEY = 'plans';

const usePlans = () => {
    const api = useApi();
    const cache = useCache();
    const getPlans = (Cycle) => api(queryPlans({ Cycle })).then(({ Plans }) => Plans);
    const load = useCallback(() => getPlans(MONTHLY), []);

    return useCachedResult(cache, KEY, load);
};

export default usePlans;
