import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import { selectKeyReactivationRequests } from './index';

export const useInactiveKeys = () => {
    return useSelector(selectKeyReactivationRequests);
};
