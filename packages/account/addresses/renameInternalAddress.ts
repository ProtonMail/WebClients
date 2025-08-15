import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { renameInternalAddress, updateAddress } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';
import { getRenamedAddressKeys } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type AddressesState, addressThunk } from './index';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState;

export const renameInternalAddressThunk = ({
    address,
    newEmail,
    localEmail,
    displayName,
}: {
    address: Address;
    newEmail: string;
    localEmail: string | undefined;
    displayName: string | undefined;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        if (localEmail !== undefined) {
            const [userKeys, organizationKey] = await Promise.all([
                dispatch(userKeysThunk()),
                dispatch(organizationKeyThunk()),
            ]);
            await api(
                renameInternalAddress(address.ID, {
                    Local: localEmail,
                    AddressKeys: await getRenamedAddressKeys({
                        userKeys,
                        addressKeys: address.Keys,
                        organizationKey: organizationKey?.privateKey ? organizationKey : undefined,
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

        await Promise.all([
            dispatch(addressThunk({ address, cache: CacheType.None })),
            dispatch(userThunk({ cache: CacheType.None })),
        ]);
    };
};
