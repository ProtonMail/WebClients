import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { renameExternalAddress } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getEmailParts } from '@proton/shared/lib/helpers/email';
import type { Address } from '@proton/shared/lib/interfaces';
import { getRenamedAddressKeys } from '@proton/shared/lib/keys';

import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type AddressesState, addressThunk } from './index';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState;

export const renameExternalAddressThunk = ({
    address,
    email,
}: {
    address: Address;
    email: string;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);
        const [userKeys, organizationKey] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(organizationKeyThunk()),
        ]);
        const [Local, Domain] = getEmailParts(email);
        await api(
            renameExternalAddress(address.ID, {
                Local,
                Domain,
                AddressKeys: await getRenamedAddressKeys({
                    userKeys,
                    addressKeys: address.Keys,
                    organizationKey: organizationKey?.privateKey ? organizationKey : undefined,
                    email,
                }),
            })
        );
        await Promise.all([
            dispatch(addressThunk({ address, cache: CacheType.None })),
            dispatch(userThunk({ cache: CacheType.None })),
        ]);
    };
};
