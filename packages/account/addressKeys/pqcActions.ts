import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { addAddressKeysProcess, addUserKeysProcess, getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';
import { getIsDeviceRecoveryEnabled } from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { getIsRecoveryFileAvailable } from '@proton/shared/lib/recoveryFile/recoveryFile';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys/index';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { type UserSettingsState, userSettingsActions, userSettingsThunk } from '../userSettings';

export const generatePqcAddressKeys = (): ThunkAction<
    Promise<void>,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [user, userKeys, addresses] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
        ]);
        const api = getSilentApi(extra.api);
        await Promise.all(
            addresses.map(async (address) => {
                const { ID: addressID } = address;
                const addressKeys = await dispatch(addressKeysThunk({ addressID }));
                // v6 key already present, skip (TODO: check PQC algo)
                if (addressKeys.some((key) => key.privateKey.isPrivateKeyV6())) {
                    return;
                }
                const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
                    ktActivation: dispatch(getKTActivation()),
                    api,
                    config: extra.config,
                });
                const [, updatedActiveKeys, formerActiveKeys] = await addAddressKeysProcess({
                    api,
                    userKeys,
                    keyGenConfig: KEYGEN_CONFIGS.PQC,
                    addresses,
                    address,
                    addressKeys,
                    keyPassword: extra.authentication.getPassword(),
                    keyTransparencyVerify,
                });
                await Promise.all([
                    resignSKLWithPrimaryKey({
                        api,
                        ktActivation: dispatch(getKTActivation()),
                        address,
                        newPrimaryKeys: getPrimaryAddressKeysForSigning(updatedActiveKeys, true),
                        formerPrimaryKeys: getPrimaryAddressKeysForSigning(formerActiveKeys, true),
                        userKeys,
                    }),
                    keyTransparencyCommit(user, userKeys),
                ]);
            })
        );

        await dispatch(addressesThunk({ cache: CacheType.None })); // Ensures address keys is up to date.
    };
};

export const generatePqcUserKey = (): ThunkAction<
    Promise<void>,
    AddressKeysState & UserSettingsState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [user, userKeys, userSettings, addresses, organizationKey] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(userSettingsThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        const isDeviceRecoveryAvailable = getIsRecoveryFileAvailable({
            user,
            addresses,
            userKeys,
        });
        const isDeviceRecoveryEnabled = getIsDeviceRecoveryEnabled(userSettings, extra.authentication);

        await addUserKeysProcess({
            api: getSilentApi(extra.api),
            user,
            organizationKey,
            isDeviceRecoveryAvailable,
            isDeviceRecoveryEnabled,
            keyGenConfig: KEYGEN_CONFIGS.PQC,
            userKeys,
            addresses,
            passphrase: extra.authentication.getPassword(),
        });
        await dispatch(userThunk({ cache: CacheType.None })); // Ensures user keys is up to date.
    };
};

export const optInToPqc = (): ThunkAction<
    Promise<void>,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const updatedFlagSupportPgpV6Keys = { SupportPgpV6Keys: 1 } as const;
        await getSilentApi(extra.api)(updateFlags(updatedFlagSupportPgpV6Keys));
        // optimistically update user settings without waiting for event loop;
        // this is done only after awaiting the API response since it will fail if the action is not authorized.
        dispatch(userSettingsActions.update({ UserSettings: { Flags: updatedFlagSupportPgpV6Keys } }));
    };
};
