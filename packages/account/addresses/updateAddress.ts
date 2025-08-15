import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { updateAddress } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';

import { type UserState, userThunk } from '../user';
import { type AddressesState, addressThunk } from './index';

type RequiredState = AddressesState & UserState;

export const updateAddressThunk = ({
    address,
    displayName,
    signature,
}: {
    address: Address;
    displayName: string;
    signature?: string;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        await api(
            updateAddress(address.ID, {
                DisplayName: displayName,
                Signature: signature ?? address.Signature,
            })
        );
        await Promise.all([
            dispatch(addressThunk({ address, cache: CacheType.None })),
            dispatch(userThunk({ cache: CacheType.None })),
        ]);
    };
};
