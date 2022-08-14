import { Organization } from '@proton/shared/lib/interfaces';

import { cachedPromise } from './helpers/cachedPromise';
import useCache from './useCache';
import { useGetOrganizationKeyRaw } from './useGetOrganizationKeyRaw';
import usePromiseResult from './usePromiseResult';
import { useUser } from './useUser';

const useOrganizationKey = (organization?: Organization) => {
    const cache = useCache();
    const getOrganizationKeyRaw = useGetOrganizationKeyRaw();
    const [user] = useUser();

    return usePromiseResult(async () => {
        if (!user.isAdmin || !organization) {
            return;
        }
        // Warning: There is no event update coming for organization key changes, however, an update for the organization
        // is received as the keys are changed. So each time it changes, it will redo this.
        return cachedPromise(
            cache,
            'ORGANIZATION_KEY',
            async () => {
                return getOrganizationKeyRaw();
            },
            organization
        );
    }, [user, organization]);
};

export default useOrganizationKey;
