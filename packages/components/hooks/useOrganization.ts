import { useCallback } from 'react';
import { Organization as tsOrganizationModel } from '@proton/shared/lib/interfaces';
import { FREE_ORGANIZATION } from '@proton/shared/lib/constants';
import { OrganizationModel } from '@proton/shared/lib/models/organizationModel';
import { UserModel } from '@proton/shared/lib/models/userModel';

import useCachedModelResult from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

const useOrganization = (): [tsOrganizationModel, boolean, Error] => {
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
