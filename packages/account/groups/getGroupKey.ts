import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { getDecryptedGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import type { AddressesState } from '../addresses';
import type { KtState } from '../kt';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import type { UserKeysState } from '../userKeys';
import { userKeysThunk } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;
export const getGroupKey = ({
    groupAddress,
}: {
    groupAddress: Address;
}): ThunkAction<Promise<DecryptedAddressKey>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const organizationKey = await dispatch(organizationKeyThunk());
        if (organizationKey.privateKey) {
            // Use organization key if we have it
            const forwarderKey = await getDecryptedGroupAddressKey(groupAddress.Keys, organizationKey.privateKey);

            if (!forwarderKey) {
                throw new Error('Missing group address keys');
            }

            return forwarderKey;
        }

        // If we don't have the organization key, use the user key
        const userKeys = await dispatch(userKeysThunk());
        if (!userKeys) {
            throw new Error('No organization keys nor user keys available');
        }

        const primaryUserKey = userKeys[0];
        const forwarderKey = await getDecryptedGroupAddressKey(groupAddress.Keys, primaryUserKey.privateKey, {
            required: true,
            value: 'account.key-token.address',
        });

        if (!forwarderKey) {
            throw new Error('Missing group address keys');
        }

        return forwarderKey;
    };
};
