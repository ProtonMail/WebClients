import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { AddressKeysState } from '@proton/account/addressKeys';
import { addressesThunk } from '@proton/account/addresses';
import { signoutAction } from '@proton/account/authenticationService';
import { type OrganizationKeyState, organizationKeyThunk } from '@proton/account/organizationKey';
import { type UserState, userThunk } from '@proton/account/user';
import { userKeysThunk } from '@proton/account/userKeys';
import { type UserSettingsState, userSettingsThunk } from '@proton/account/userSettings';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { consumeSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { lockSensitiveSettings } from '@proton/shared/lib/api/user';
import mutatePassword from '@proton/shared/lib/authentication/mutate';
import { generateKeySaltAndPassphrase, getHasMigratedAddressKeys } from '@proton/shared/lib/keys';
import { getArmoredPrivateUserKeys, getEncryptedArmoredOrganizationKey } from '@proton/shared/lib/keys/changePassword';
import { srpVerify } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

type RequiredState = UserState & AddressKeysState & OrganizationKeyState & UserSettingsState;
export const sessionRecoveryChangePassword = ({
    newPassword,
}: {
    newPassword: string;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        try {
            extra.eventManager.stop();

            const api = getSilentApi(extra.api);

            const [user, addresses, userKeysList, organizationKey] = await Promise.all([
                dispatch(userThunk()),
                dispatch(addressesThunk()),
                dispatch(userKeysThunk()),
                dispatch(organizationKeyThunk()),
            ]);

            /**
             * This is the case for a user who does not have any keys set-up.
             * They will be in 2-password mode, but not have any keys.
             * Changing to one-password mode or mailbox password is not allowed.
             * It's not handled better because it's a rare case.
             */
            if (userKeysList.length === 0) {
                throw new Error(
                    c('session_recovery:available:error').t`Please generate keys before you try to change your password`
                );
            }

            const hasMigratedAddressKeys = getHasMigratedAddressKeys(addresses);
            if (!hasMigratedAddressKeys) {
                throw new Error(
                    c('session_recovery:available:error').t`Account recovery not available for legacy address keys`
                );
            }

            const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(newPassword);

            const [armoredUserKeys, armoredOrganizationKey] = await Promise.all([
                getArmoredPrivateUserKeys(userKeysList, keyPassword),
                getEncryptedArmoredOrganizationKey(organizationKey?.privateKey, keyPassword),
            ]);

            await srpVerify({
                api,
                credentials: {
                    password: newPassword,
                },
                config: consumeSessionRecovery({
                    UserKeys: armoredUserKeys,
                    KeySalt: keySalt,
                    OrganizationKey: armoredOrganizationKey,
                }),
            });

            try {
                await mutatePassword({
                    api,
                    authentication: extra.authentication,
                    User: user,
                    keyPassword,
                    clearKeyPassword: newPassword,
                });
            } catch (e) {
                // If there was an error persisting the session, we have no choice but to logout
                dispatch(signoutAction({ clearDeviceRecovery: true }));
                throw e;
            }

            api(lockSensitiveSettings()).catch(noop);

            await Promise.all([
                dispatch(userThunk({ cache: CacheType.None })), // User keys affected
                dispatch(userSettingsThunk({ cache: CacheType.None })), // User settings for two password mode
                dispatch(addressesThunk({ cache: CacheType.None })), // Address keys affected
                dispatch(organizationKeyThunk({ cache: CacheType.None })), // Organization key potentially affected
            ]);
        } finally {
            extra.eventManager.start();
        }
    };
};
