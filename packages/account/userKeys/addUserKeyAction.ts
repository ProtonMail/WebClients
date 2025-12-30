import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { KeyGenConfig, KeyGenConfigV6 } from '@proton/shared/lib/interfaces';
import { addUserKeysProcess } from '@proton/shared/lib/keys';
import { getIsDeviceRecoveryEnabled } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { getIsRecoveryFileAvailable } from '@proton/shared/lib/recoveryFile/recoveryFile';

import { type AddressesState, addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type UserSettingsState, userSettingsThunk } from '../userSettings';

export const addUserKeyAction = ({
    keyGenConfig,
}: {
    keyGenConfig: KeyGenConfig | KeyGenConfigV6;
}): ThunkAction<
    Promise<{ fingerprint: string }>,
    UserKeysState & AddressesState & UserSettingsState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        try {
            extra.eventManager.stop();
            const api = getSilentApi(extra.api);
            const [user, userSettings, userKeys, addresses, organizationKey] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userSettingsThunk()),
                dispatch(userKeysThunk()),
                dispatch(addressesThunk()),
                dispatch(organizationKeyThunk()),
            ]);

            const isDeviceRecoveryAvailable = getIsRecoveryFileAvailable({
                user,
                addresses,
                userKeys,
                appName: extra.config.APP_NAME,
            });
            const isDeviceRecoveryEnabled = getIsDeviceRecoveryEnabled(userSettings, extra.authentication);

            const newKey = await addUserKeysProcess({
                api,
                user,
                organizationKey,
                isDeviceRecoveryAvailable,
                isDeviceRecoveryEnabled,
                keyGenConfig,
                userKeys,
                addresses,
                passphrase: extra.authentication.getPassword(),
            });
            await dispatch(userThunk({ cache: CacheType.None }));
            return { fingerprint: newKey.getFingerprint() };
        } finally {
            extra.eventManager.start();
        }
    };
};
