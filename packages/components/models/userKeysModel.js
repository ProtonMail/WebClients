import { useCallback } from 'react';
import { useCachedResult, useCache, useAuthenticationStore } from 'react-components';
import { prepareUserKeys } from 'proton-shared/lib/keys/keys';
import validateDependencies from './helpers/validateDependencies';

const KEY = 'userKeys';

const useUserKeys = (User) => {
    const cache = useCache();
    const authenticationStore = useAuthenticationStore();

    validateDependencies(cache, KEY, [User]);

    const load = useCallback(() => {
        const { value: previousValue } = cache.get(KEY) || {};
        return prepareUserKeys({
            UserKeys: User.Keys,
            keyPassword: authenticationStore.getPassword(),
            OrganizationPrivateKey: User.OrganizationPrivateKey,
            cache: previousValue
        });
    }, [User]);

    return useCachedResult(cache, KEY, load);
};

export default useUserKeys;
