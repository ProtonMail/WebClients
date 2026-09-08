import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createAddressKeysThunk, getCreateAddressKeysPayload } from '@proton/account/addressKeys/createAddressKeys';
import type { AddressKeyCreationRequiredState } from '@proton/account/addressKeys/createAddressKeys';
import type { AddressesState } from '@proton/account/addresses';
import { addressesThunk } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import { organizationThunk } from '@proton/account/organization';
import type { UserState } from '@proton/account/user';
import { userThunk } from '@proton/account/user';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { convertToBYOEAddress, createBYOEAddress as createBYOEAddressApi } from '../api/api';

type ConvertByoeAddressState = KtState & UserState & AddressesState;

export const createBYOEAddress = ({
    emailAddressParts,
}: {
    emailAddressParts: { Local: string; Domain: string };
    displayName?: string;
}): ThunkAction<Promise<Address | undefined>, AddressKeyCreationRequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const organization = await dispatch(organizationThunk());

        const api = getSilentApi(extra.api);
        const emailAddress = `${emailAddressParts.Local}@${emailAddressParts.Domain}`;

        // NOTE: Important this is done _before_ address creation so that the address is not created if keys can't be created.
        const addressKeyCreationPayload = await dispatch(getCreateAddressKeysPayload());

        const { Address } = await api<{ Address: Address }>(
            createBYOEAddressApi({
                Email: emailAddress,
                OrganizationId: organization.ID,
            })
        );

        const updatedAddresses = await dispatch(
            createAddressKeysThunk({
                addressKeyCreationPayload,
                addressesToGenerate: [Address],
            })
        );

        // Update user object for BYOE. TODO: Is this still needed?
        dispatch(userThunk({ cache: CacheType.None })).catch(noop);

        return updatedAddresses.find(({ ID }) => ID === Address.ID) || Address;
    };
};

export const convertBYOEAddress = ({
    addressID,
}: {
    addressID: string;
}): ThunkAction<Promise<Address | undefined>, ConvertByoeAddressState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const { Address } = await api<{ Address: Address }>(convertToBYOEAddress(addressID));

        const [, result] = await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(addressesThunk({ cache: CacheType.None })),
        ]);

        return result.find(({ ID }) => ID === Address.ID) || Address;
    };
};
