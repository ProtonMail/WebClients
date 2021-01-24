import { useCallback } from 'react';
import { OrganizationKey } from 'proton-shared/lib/interfaces';
import { getDecryptedOrganizationKey } from 'proton-shared/lib/keys';
import { getOrganizationKeys } from 'proton-shared/lib/api/organization';

import useApi from './useApi';
import useAuthentication from './useAuthentication';

export const useGetOrganizationKeyRaw = () => {
    const authentication = useAuthentication();
    const api = useApi();

    return useCallback(async () => {
        const Key = await api<OrganizationKey>(getOrganizationKeys());
        return getDecryptedOrganizationKey({ keyPassword: authentication.getPassword(), Key });
    }, []);
};

export default useGetOrganizationKeyRaw;
