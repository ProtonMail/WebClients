import { useCallback } from 'react';
import { useCachedResult, useCache, useAuthenticationStore } from 'react-components';
import { prepareAddressKeys } from 'proton-shared/lib/keys/keys';
import validateDependencies from './helpers/validateDependencies';

const KEY = 'addressesKeys';

const useAddressesKeys = (User, Addresses) => {
    const cache = useCache();
    const authenticationStore = useAuthenticationStore();

    validateDependencies(cache, KEY, [User, Addresses]);

    const load = useCallback(() => {
        const { value: previousValue } = cache.get(KEY) || {};
        return prepareAddressKeys({
            Addresses,
            keyPassword: authenticationStore.getPassword(),
            OrganizationPrivateKey: User.OrganizationPrivateKey,
            cache: previousValue
        });
    }, [User, Addresses]);

    return useCachedResult(cache, KEY, load);
};

export default useAddressesKeys;
