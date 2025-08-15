import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { replaceAddressTokens } from '@proton/shared/lib/api/keys';
import type { Address, DecryptedKey, Member } from '@proton/shared/lib/interfaces';
import {
    getHasMigratedAddressKeys,
    getMemberKeys,
    getReplacedAddressKeyTokens,
    splitKeys,
} from '@proton/shared/lib/keys';

import { getMemberAddresses } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type AddressesState, addressesThunk } from './index';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState;

export const replaceAddressTokensIfNeeded = ({
    addresses,
    userKeys,
}: {
    addresses: Address[];
    userKeys: DecryptedKey[];
}): ThunkAction<ReturnType<typeof getReplacedAddressKeyTokens>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        if (!(getHasMigratedAddressKeys(addresses) && userKeys.length > 1)) {
            return { AddressKeyTokens: [] };
        }
        // The token is validated with the primary user key, and this is to ensure that the address tokens are encrypted to the primary user key.
        // NOTE: Reencrypting address token happens automatically when generating a new user key, but there are users who generated user keys before that functionality existed.
        const primaryUserKey = userKeys[0].privateKey;
        const splitUserKeys = splitKeys(userKeys);
        const replacedResult = await getReplacedAddressKeyTokens({
            addresses,
            privateKeys: splitUserKeys.privateKeys,
            privateKey: primaryUserKey,
        });
        if (replacedResult.AddressKeyTokens.length) {
            await api(replaceAddressTokens(replacedResult));
        }
        return replacedResult;
    };
};

export const replaceMemberAddressTokensIfNeeded = ({
    member,
}: {
    member: Member;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        const [memberAddresses, organizationKey] = await Promise.all([
            dispatch(getMemberAddresses({ member, retry: true })),
            dispatch(organizationKeyThunk()),
        ]);

        if (!organizationKey.privateKey) {
            throw new Error('Missing organization private key');
        }

        const { memberUserKeys } = await getMemberKeys({
            member,
            memberAddresses,
            organizationKey: {
                privateKey: organizationKey.privateKey,
                publicKey: organizationKey.publicKey,
            },
        });

        const result = await dispatch(
            replaceAddressTokensIfNeeded({ addresses: memberAddresses, userKeys: memberUserKeys })
        );

        if (result.AddressKeyTokens.length) {
            await dispatch(getMemberAddresses({ member, retry: true, cache: CacheType.None }));
        }
    };
};

export const replaceSelfAddressTokensIfNeeded = (): ThunkAction<
    Promise<void>,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [addresses, userKeys] = await Promise.all([dispatch(addressesThunk()), dispatch(userKeysThunk())]);
        const result = await dispatch(replaceAddressTokensIfNeeded({ addresses, userKeys }));
        if (result.AddressKeyTokens.length) {
            await dispatch(addressesThunk({ cache: CacheType.None }));
        }
    };
};
