import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import innerMutatePassword from '@proton/shared/lib/authentication/mutate';
import { getDeviceSecretDataByUser } from '@proton/shared/lib/keys/device';
import { changeSSOUserKeysPasswordHelper } from '@proton/shared/lib/keys/password';

import { userThunk } from '../user';
import type { UserKeysState } from '../userKeys';
import { userKeysThunk } from '../userKeys';

export const changeSSOUserBackupPassword = ({
    newBackupPassword,
}: {
    newBackupPassword: string;
}): ThunkAction<Promise<void>, UserKeysState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const [user, userKeys] = await Promise.all([dispatch(userThunk()), dispatch(userKeysThunk())]);
        const deviceSecretData = await getDeviceSecretDataByUser({ user });

        const api = extra.api;
        const authentication = extra.authentication;

        const { keyPassword } = await changeSSOUserKeysPasswordHelper({
            newBackupPassword,
            api: getSilentApi(api),
            user,
            userKeys,
            deviceSecretData,
        });

        await innerMutatePassword({
            api,
            authentication,
            keyPassword,
            clearKeyPassword: newBackupPassword,
            User: user,
            source: SessionSource.Saml,
        });
    };
};
