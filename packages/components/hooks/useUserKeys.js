import { useCallback } from 'react';
import { decryptKeyWithFormat, decryptPrivateKeyArmored, getUserKeyPassword } from 'proton-shared/lib/keys/keys';
import { noop } from 'proton-shared/lib/helpers/function';
import useCachedModelResult, { getPromiseValue } from './useCachedModelResult';
import useAuthentication from '../containers/authentication/useAuthentication';
import { useGetUser } from './useUser';
import useCache from '../containers/cache/useCache';

export const KEY = 'USER_KEYS';

export const useGetUserKeysRaw = () => {
    const authentication = useAuthentication();
    const getUser = useGetUser();

    return useCallback(async () => {
        const { OrganizationPrivateKey, Keys } = await getUser();

        const keyPassword = authentication.getPassword();

        const organizationKey = OrganizationPrivateKey
            ? await decryptPrivateKeyArmored(OrganizationPrivateKey, keyPassword).catch(noop)
            : undefined;

        return Promise.all(
            Keys.map(async (Key) => {
                return decryptKeyWithFormat(Key, await getUserKeyPassword(Key, { organizationKey, keyPassword }));
            })
        );
    }, [getUser]);
};

export const useGetUserKeys = () => {
    const cache = useCache();
    const miss = useGetUserKeysRaw();
    return useCallback(async () => {
        return getPromiseValue(cache, KEY, miss);
    }, [miss]);
};

export const useUserKeys = () => {
    const cache = useCache();
    const getUserKeysAsync = useGetUserKeys();
    return useCachedModelResult(cache, KEY, getUserKeysAsync);
};
