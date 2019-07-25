import { queryPlans } from 'proton-shared/lib/api/payments';
import { CYCLE } from 'proton-shared/lib/constants';

import useCachedModelResult from './useCachedModelResult';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';

const { MONTHLY } = CYCLE;
const KEY = 'plans';

const getPlans = (api, Cycle) => api(queryPlans({ Cycle })).then(({ Plans }) => Plans);

const usePlans = () => {
    const api = useApi();
    const cache = useCache();
    return useCachedModelResult(cache, KEY, () => getPlans(api, MONTHLY));
};

export default usePlans;
