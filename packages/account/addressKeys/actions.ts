import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/lib';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { Address } from '@proton/shared/lib/interfaces';
import { setAddressFlagsHelper } from '@proton/shared/lib/keys/addressFlagsHelper';

import type { KtState } from '..//kt';
import { type AddressKeysState, addressKeysThunk } from '../addressKeys/index';
import { addressThunk, addressesThunk } from '../addresses';
import { getKTActivation } from '../kt/actions';

export const setAddressFlags = ({
    address: initialAddress,
    encryptionDisabled,
    expectSignatureDisabled,
}: {
    address: Address;
    encryptionDisabled: boolean;
    expectSignatureDisabled: boolean;
}): ThunkAction<Promise<Address | undefined>, AddressKeysState & KtState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        if (!initialAddress) {
            throw new Error('No address provided');
        }
        const api = getSilentApi(extra.api);

        const { keyTransparencyVerify } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });
        const address = (await dispatch(addressesThunk())).find(
            (otherAddress) => initialAddress.ID === otherAddress.ID
        );
        if (!address) {
            throw new Error('Address deleted');
        }
        await setAddressFlagsHelper({
            encryptionDisabled,
            expectSignatureDisabled,
            addressKeys: await dispatch(addressKeysThunk({ addressID: address.ID })),
            address,
            keyTransparencyVerify,
            api,
        });
        return dispatch(addressThunk({ address, cache: CacheType.None }));
    };
};
