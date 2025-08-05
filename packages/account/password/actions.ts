import { type UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { disable2FA as disable2FAConfig, updatePassword } from '@proton/shared/lib/api/settings';
import mutatePassword from '@proton/shared/lib/authentication/mutate';
import type { Api } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getIsPasswordless } from '@proton/shared/lib/keys';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { srpVerify } from '@proton/shared/lib/srp';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys';
import { addressesThunk } from '../addresses';
import { signoutAction } from '../authenticationService';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { type UserState, userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { type UserSettingsState, userSettingsThunk } from '../userSettings';

type RequiredState = UserState & AddressKeysState & OrganizationKeyState & UserSettingsState;

/**
 * Changes the login password for users in two-password mode. Where they use one password to sign in and another password
 * to decrypt keys. This is used both for switching to 2-password mode and separately changing the login password.
 *
 * @param api - The API
 * @param newPassword - The new login password
 * @param persistPasswordScope - Pass true in case more actions will be done after, for example changing the key password.
 */
export const changeLoginPassword = ({
    api,
    newPassword,
    persistPasswordScope,
}: {
    api: Api;
    newPassword: string;
    persistPasswordScope: boolean;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return () => {
        return srpVerify({
            api,
            credentials: {
                password: newPassword,
            },
            config: updatePassword({ PersistPasswordScope: persistPasswordScope }),
        });
    };
};

/**
 * Changes the key password for users in one-password and two-password mode, as well as changing the login password for users in one-password mode.
 * @param api - The API
 * @param newPassword - The new key password (and login password in case of one password mode)
 * @param mode - In the two-password-mode case, only the key password is updated. Otherwise also the login password.
 * @param disable2FA - Pass true for signed in password reset when 2FA should also be disabled.
 */
export const changePassword = ({
    api,
    newPassword,
    mode,
    disable2FA,
}: {
    api: Api;
    newPassword: string;
    mode: 'two-password-mode' | 'one-password-mode';
    disable2FA: boolean;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        extra.eventManager.stop();
        try {
            const [addresses, user, userKeysList, organizationKey] = await Promise.all([
                dispatch(addressesThunk()),
                dispatch(userThunk()),
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
                throw new Error(c('Error').t`Please generate keys before you try to change your password`);
            }

            const { passphrase: keyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(newPassword);

            const addressesKeys = await Promise.all(
                addresses.map(async (address) => {
                    return { address, keys: await dispatch(addressKeysThunk({ addressID: address.ID })) };
                })
            );
            const updateKeysPayload = await getUpdateKeysPayload({
                addressesKeys,
                userKeys: userKeysList,
                organizationKey: getIsPasswordless(organizationKey?.Key) ? undefined : organizationKey?.privateKey,
                keyPassword,
                keySalt,
            });

            if (disable2FA) {
                await api(disable2FAConfig({ PersistPasswordScope: true }));
            }

            const routeConfig = updatePrivateKeyRoute(updateKeysPayload);

            if (mode === 'two-password-mode') {
                await api(routeConfig);
            } else {
                await srpVerify({
                    api,
                    credentials: { password: newPassword },
                    config: routeConfig,
                });
            }

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

            // Force refresh instead of polling event loop
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
