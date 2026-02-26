import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getIsExpectSignatureDisabled } from '@proton/shared/lib/helpers/address';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { setAddressFlagsHelper } from '@proton/shared/lib/keys/addressFlagsHelper';

import type { AddressesState } from '../addresses';
import { setNoEncryptFlag } from '../groups/index';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import type { OrganizationKeyState } from '../organizationKey';
import type { UserKeysState } from '../userKeys';
import { getGroupKey } from './getGroupKey';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

export const setGroupAddressFlags = ({
    flagState,
    groupAddress,
    forwarderKey,
}: {
    flagState: boolean; // true to disable e2ee, false to enable
    groupAddress: Address;
    forwarderKey: DecryptedAddressKey;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const { keyTransparencyVerify } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });
        await setAddressFlagsHelper({
            encryptionDisabled: flagState,
            expectSignatureDisabled: getIsExpectSignatureDisabled(groupAddress),
            address: groupAddress,
            addressKeys: [forwarderKey],
            keyTransparencyVerify,
            api,
        });
    };
};

export const disableGroupAddressEncryption = ({
    groupAddress,
    forwarderKey: maybeForwarderKey,
}: {
    groupAddress: Address;
    forwarderKey?: DecryptedAddressKey;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const forwarderKey = maybeForwarderKey ?? (await dispatch(getGroupKey({ groupAddress })));
        await dispatch(setGroupAddressFlags({ groupAddress, flagState: true, forwarderKey }));
        dispatch(
            setNoEncryptFlag({
                addressID: groupAddress.ID,
                noEncryptFlag: true,
            })
        );
    };
};

export const enableGroupAddressEncryption = ({
    groupAddress,
    forwarderKey: maybeForwarderKey,
}: {
    groupAddress: Address;
    forwarderKey?: DecryptedAddressKey;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const forwarderKey = maybeForwarderKey ?? (await dispatch(getGroupKey({ groupAddress })));
        await dispatch(setGroupAddressFlags({ groupAddress, flagState: false, forwarderKey }));
        dispatch(
            setNoEncryptFlag({
                addressID: groupAddress.ID,
                noEncryptFlag: false,
            })
        );
    };
};
