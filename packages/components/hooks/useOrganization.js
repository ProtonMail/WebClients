import { useCallback } from 'react';
import { FREE_ORGANIZATION } from 'proton-shared/lib/constants';
import { OrganizationModel } from 'proton-shared/lib/models/organizationModel';
import { UserModel } from 'proton-shared/lib/models/userModel';

import useCachedModelResult from './useCachedModelResult';
import useApi from '../containers/api/useApi';
import useCache from '../containers/cache/useCache';

const useOrganization = () => {
    const cache = useCache();
    const api = useApi();

    const miss = useCallback(() => {
        // Not using use user since it's better to read from the cache
        // It will be updated from the event manager.
        const user = cache.get(UserModel.key).value;
        if (user.isPaid) {
            return OrganizationModel.get(api);
        }
        return Promise.resolve(FREE_ORGANIZATION);
    }, [api, cache]);

    return useCachedModelResult(cache, OrganizationModel.key, miss);
};

export default useOrganization;
