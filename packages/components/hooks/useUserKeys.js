import { useCache, usePromiseResult, useAuthentication } from 'react-components';
import { decryptPrivateKey } from 'pmcrypto';
import { prepareKeys } from 'proton-shared/lib/keys/keys';
import { prepareMemberKeys } from 'proton-shared/lib/keys/organizationKeys';
import { noop } from 'proton-shared/lib/helpers/function';

import { cachedPromise } from './helpers/cachedPromise';

const useUserKeys = (User) => {
    const cache = useCache();
    const authentication = useAuthentication();

    return usePromiseResult(() => {
        const { ID, OrganizationPrivateKey, Keys } = User;

        return cachedPromise(
            cache,
            ID,
            async () => {
                const keyPassword = authentication.getPassword();

                if (OrganizationPrivateKey) {
                    const organizationKey = await decryptPrivateKey(OrganizationPrivateKey, keyPassword).catch(noop);
                    return prepareMemberKeys(Keys, organizationKey);
                }

                return prepareKeys(Keys, keyPassword);
            },
            Keys
        );
    }, [User]);
};

export default useUserKeys;
