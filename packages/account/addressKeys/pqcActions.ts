import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { resignSKLWithPrimaryKey } from '@proton/key-transparency/shared';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { updateFlags } from '@proton/shared/lib/api/settings';
import { KEYGEN_CONFIGS } from '@proton/shared/lib/constants';
import { addAddressKeysProcess, addUserKeysProcess, getPrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';

import { type AddressKeysState, addressKeysThunk } from '../addressKeys/index';
import { addressesThunk } from '../addresses';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { userSettingsActions } from '../userSettings';

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

export const generatePqcUserKey = ({
    isDeviceRecoveryAvailable,
    isDeviceRecoveryEnabled,
}: {
    /* TODO: Move device recovery to be redux-compatible */
    isDeviceRecoveryAvailable: boolean;
    isDeviceRecoveryEnabled: boolean;
}): ThunkAction<
    Promise<void>,
    AddressKeysState & OrganizationKeyState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [user, userKeys, addresses, organizationKey] = await Promise.all([
            dispatch(userThunk()),
            dispatch(userKeysThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationKeyThunk()),
        ]);

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
