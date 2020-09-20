import { Organization } from 'proton-shared/lib/interfaces';
import useCache from './useCache';
import { useUser } from './useUser';
import { useGetOrganizationKeyRaw, OrganizationKey } from './useGetOrganizationKeyRaw';
import usePromiseResult from './usePromiseResult';

import { cachedPromise } from './helpers/cachedPromise';

const useOrganizationKey = (organization: Organization): [OrganizationKey | undefined, boolean, Error] => {
    const cache = useCache();
    const getOrganizationKeyRaw = useGetOrganizationKeyRaw();
    const [user] = useUser();

    return usePromiseResult(() => {
        if (!user.isAdmin || !organization) {
            return Promise.resolve();
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
