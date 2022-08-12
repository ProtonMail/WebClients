import { useCallback } from 'react';

import { FREE_ORGANIZATION } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';
import { OrganizationModel } from '@proton/shared/lib/models/organizationModel';

import useApi from './useApi';
import useCache from './useCache';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import { useGetUser } from './useUser';

export const useGetOrganization = (): (() => Promise<Organization>) => {
    const api = useApi();
    const cache = useCache();
    const getUser = useGetUser();
    const miss = useCallback(async () => {
        const user = await getUser();
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
