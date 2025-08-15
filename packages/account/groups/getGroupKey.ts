import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { AddressesState } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import type { UserKeysState } from '@proton/account/userKeys';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { getDecryptedGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;
export const getGroupKey = ({
    groupAddress,
}: {
    groupAddress: Address;
}): ThunkAction<Promise<DecryptedAddressKey>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        if (organizationKey.privateKey === undefined) {
            throw new Error('Organization key is undefined');
        }
        const forwarderKey = await getDecryptedGroupAddressKey(groupAddress.Keys, organizationKey.privateKey);
        if (!forwarderKey) {
            throw new Error('Missing group address keys');
        }
        return forwarderKey;
    };
};
