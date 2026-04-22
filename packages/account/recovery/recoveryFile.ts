import { type UnknownAction, createSelector } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { selectAddresses } from '@proton/account/addresses';
import { type UserState, selectUser, userThunk } from '@proton/account/user';
import { type UserKeysState, selectUserKeys, userKeysThunk } from '@proton/account/userKeys';
import { type UserSettingsState, selectUserSettings, userSettingsThunk } from '@proton/account/userSettings';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { setNewRecoverySecret } from '@proton/shared/lib/api/settingsRecovery';
import {
    exportRecoveryFile,
    generateRecoverySecret,
    getHasOutdatedRecoveryFile,
    getIsRecoveryFileAvailable,
    getPrimaryRecoverySecret,
    getRecoverySecrets,
    validateRecoverySecret,
} from '@proton/shared/lib/recoveryFile/recoveryFile';
import { getHasRecoveryMessage } from '@proton/shared/lib/recoveryFile/storage';

export const downloadRecoveryFileThunk = (): ThunkAction<
    Promise<void>,
    UserState & UserKeysState & UserSettingsState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, getState, extra) => {
        const user = await dispatch(userThunk());
        const userKeys = await dispatch(userKeysThunk());
        const primaryUserKey = userKeys[0];
        if (!primaryUserKey) {
            return;
        }

        const primaryRecoverySecret = getPrimaryRecoverySecret(user.Keys);

        if (!primaryRecoverySecret) {
            const { recoverySecret, signature } = await generateRecoverySecret(primaryUserKey.privateKey);
            await extra.api(
                setNewRecoverySecret({
                    RecoverySecret: recoverySecret,
                    Signature: signature,
                })
            );
            await exportRecoveryFile({ recoverySecret, userKeys });
            await Promise.all([
                dispatch(userSettingsThunk({ cache: CacheType.None })),
                dispatch(userThunk({ cache: CacheType.None })),
            ]);
            return;
        }

        const valid = await validateRecoverySecret(primaryRecoverySecret, primaryUserKey.publicKey);
        if (!valid) {
            throw new Error('Unable to verify recovery file signature');
        }

        await exportRecoveryFile({
            recoverySecret: primaryRecoverySecret.RecoverySecret,
            userKeys,
        });
    };
};

export const selectRecoveryFileData = createSelector(
    [selectUser, selectUserSettings, selectAddresses, selectUserKeys],
    ({ value: user }, { value: userSettings }, { value: addresses }, { value: userKeys }) => {
        if (!user || !addresses || !userKeys) {
            return {
                isAvailableOnDevice: false,
                isRecoveryFileAvailable: false,
                hasCurrentRecoveryFile: false,
                hasOutdatedRecoveryFile: false,
                recoverySecrets: [],
                loading: true,
                canRevokeRecoveryFiles: false,
                hasDeviceRecoveryEnabled: false,
            };
        }
        const hasDeviceRecoveryEnabled = Boolean(userSettings?.DeviceRecovery);
        const isRecoveryFileAvailable = getIsRecoveryFileAvailable({
            user,
            addresses,
            userKeys,
        });
        const recoverySecrets = getRecoverySecrets(user.Keys);
        const hasCurrentRecoveryFile = Boolean(getPrimaryRecoverySecret(user.Keys));
        const canRevokeRecoveryFiles = recoverySecrets.length > 0;
        const isAvailableOnDevice =
            // Checking if it's enabled is a little bit of a workaround from a race condition because we sync to file after settings has updated
            // which doesn't retrigger this selector. So we just assume if it's disabled, the file won't exist.
            hasDeviceRecoveryEnabled && getHasRecoveryMessage(user.ID);
        return {
            isAvailableOnDevice,
            isRecoveryFileAvailable,
            hasCurrentRecoveryFile,
            hasOutdatedRecoveryFile: getHasOutdatedRecoveryFile(user.Keys),
            recoverySecrets,
            canRevokeRecoveryFiles,
            hasDeviceRecoveryEnabled,
            loading: false,
        };
    }
);
