import { useCallback } from 'react';
import { getDecryptedUserKeys, getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import useAuthentication from './useAuthentication';
import { useGetUser } from './useUser';

export const useGetUserKeysRaw = (): (() => ReturnType<typeof getDecryptedUserKeys>) => {
    const authentication = useAuthentication();
    const getUser = useGetUser();
    return useCallback(async () => {
        const user = await getUser();
        const keyPassword = authentication.getPassword();
        return getDecryptedUserKeysHelper(user, keyPassword);
    }, [getUser]);
};
