import { useCallback } from 'react';
import { Organization } from '@proton/shared/lib/interfaces';
import { FREE_ORGANIZATION } from '@proton/shared/lib/constants';
import { OrganizationModel } from '@proton/shared/lib/models/organizationModel';
import { UserModel } from '@proton/shared/lib/models/userModel';

import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useApi from './useApi';
import useCache from './useCache';

export const useGetOrganization = (): (() => Promise<Organization>) => {
    const api = useApi();
    const cache = useCache();
    const miss = useCallback(() => {
        // Not using use user since it's better to read from the cache
        // It will be updated from the event manager.
        const user = cache.get(UserModel.key).value;
        if (user.isPaid) {
            return OrganizationModel.get(api);
        }
        return Promise.resolve(FREE_ORGANIZATION);
    }, [api, cache]);
    return useCallback(() => {
        return getPromiseValue(cache, OrganizationModel.key, miss);
    }, [cache, miss]);
};

export const useOrganization = (): [Organization, boolean, any] => {
    const cache = useCache();
    const miss = useGetOrganization();
    return useCachedModelResult(cache, OrganizationModel.key, miss);
};
