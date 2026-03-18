import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { renameInternalAddress, updateAddress } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address, DecryptedKey, KeyPair, Member } from '@proton/shared/lib/interfaces';
import { getMemberKeys, getRenamedAddressKeys } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { type MemberState, memberThunk } from '../member';
import { getMemberAddresses } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type AddressesState, addressThunk } from './index';

type RequiredState = MemberState & AddressesState & UserKeysState & OrganizationKeyState;

export const renameInternalAddressThunk = ({
    member,
    address,
    newEmail,
    localEmail,
    displayName,
}: {
    member?: Member;
    address: Address;
    newEmail: string;
    localEmail: string | undefined;
    displayName: string | undefined;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        if (localEmail !== undefined) {
            let userKeys: DecryptedKey[] = [];
            let organizationKey: KeyPair | undefined = undefined;
            if (!member || member.Self) {
                userKeys = await dispatch(userKeysThunk());
            } else {
                const organizationKeyResult = await dispatch(organizationKeyThunk());
                if (!organizationKeyResult.privateKey) {
                    throw new Error('Unable to decrypt organization key');
                }
                organizationKey = organizationKeyResult;
                // Only interested in user keys
                const { memberUserKeys } = await getMemberKeys({ member, memberAddresses: [], organizationKey });
                userKeys = memberUserKeys;
            }

            await api(
                renameInternalAddress(address.ID, {
                    Local: localEmail,
                    AddressKeys: await getRenamedAddressKeys({
                        userKeys,
                        addressKeys: address.Keys,
                        organizationKey,
                        email: newEmail,
                    }),
                })
            );
        }

        if (displayName !== undefined) {
            await api(
                updateAddress(address.ID, {
                    DisplayName: displayName,
                    Signature: address.Signature,
                })
            ).catch(noop);
        }

        if (!member || member.Self) {
            await Promise.all([
                dispatch(addressThunk({ address, cache: CacheType.None })),
                dispatch(userThunk({ cache: CacheType.None })),
            ]);
        } else {
            await Promise.all([
                dispatch(memberThunk({ cache: CacheType.None })),
                dispatch(getMemberAddresses({ member, cache: CacheType.None, retry: true })),
            ]);
        }
    };
};
