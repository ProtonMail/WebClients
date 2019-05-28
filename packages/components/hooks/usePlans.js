import { useCachedAsyncResult, useApi } from 'react-components';
import { queryPlans } from 'proton-shared/lib/api/payments';
import { CYCLE } from 'proton-shared/lib/constants';

const { MONTHLY } = CYCLE;
const KEY = 'plans';

const getPlans = (api, Cycle) => api(queryPlans({ Cycle })).then(({ Plans }) => Plans);

const usePlans = () => {
    const api = useApi();
    return useCachedAsyncResult(KEY, () => getPlans(api, MONTHLY), []);
};

export default usePlans;
