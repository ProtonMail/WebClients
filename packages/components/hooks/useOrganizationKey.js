import { useAuthenticationStore, useUser, useApi } from 'react-components';
import { getKeys } from 'pmcrypto';
import { noop } from 'proton-shared/lib/helpers/function';
import { getOrganizationKeys } from 'proton-shared/lib/api/organization';

import useCachedAsyncResult from './useCachedAsyncResult';

const useOrganizationKey = (Organization) => {
    const authenticationStore = useAuthenticationStore();
    const api = useApi();
    const [user] = useUser();

    return useCachedAsyncResult(
        'ORGANIZATION_KEY',
        async () => {
            if (!user.isAdmin || !Organization) {
                return;
            }
            const { PrivateKey } = await api(getOrganizationKeys());
            if (!PrivateKey) {
                return;
            }
            const [privateKey] = await getKeys(PrivateKey);
            await privateKey.decrypt(authenticationStore.getPassword()).catch(noop);
            return privateKey;
        },
        [Organization]
    );
};

export default useOrganizationKey;
