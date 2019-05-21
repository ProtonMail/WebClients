import { useCallback } from 'react';
import { FREE_ORGANIZATION } from 'proton-shared/lib/constants';
import { OrganizationModel } from 'proton-shared/lib/models/organizationModel';
import { useApi, useCache, useCachedResult, useUser } from 'react-components';

export const useOrganization = () => {
    const [user] = useUser();
    const api = useApi();
    const cache = useCache();

    const load = useCallback(() => {
        if (user.isPaid) {
            return OrganizationModel.get(api);
        }

        return Promise.resolve(FREE_ORGANIZATION);
    }, [user]);
    return useCachedResult(cache, OrganizationModel.key, load);
};
