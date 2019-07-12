import { decryptPrivateKey } from 'pmcrypto';
import { prepareKeys, prepareMemberKeys } from 'proton-shared/lib/keys/keys';
import { useCache, usePromiseResult, useAuthenticationStore } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import { cachedPromise } from './helpers/cachedPromise';

const useAddressesKeys = (user, addresses) => {
    const cache = useCache();
    const authenticationStore = useAuthenticationStore();

    return usePromiseResult(async () => {
        if (!Array.isArray(addresses)) {
            return;
        }

        const { OrganizationPrivateKey } = user;
        const keyPassword = authenticationStore.getPassword();

        const keys = await Promise.all(
            addresses.map((address) => {
                const { ID, Keys } = address;

                return cachedPromise(
                    cache,
                    ID,
                    async () => {
                        if (OrganizationPrivateKey) {
                            const organizationKey = await decryptPrivateKey(OrganizationPrivateKey, keyPassword).catch(
                                noop
                            );
                            return prepareMemberKeys(Keys, organizationKey);
                        }

                        return prepareKeys(Keys, keyPassword);
                    },
                    Keys
                );
            })
        );

        return addresses.reduce((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: keys[i]
            };
        }, {});
    }, [addresses]);
};

export default useAddressesKeys;
