import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { type AddressKeysState, addressKeysThunk } from '@proton/account/addressKeys';
import { addressThunk, addressesThunk } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import { getKTActivation } from '@proton/account/kt/actions';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { disableAddress } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ActiveKeyWithVersion, Address } from '@proton/shared/lib/interfaces';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { FlagAction, getNewAddressKeyFlags } from '@proton/shared/lib/keys/getNewAddressKeyFlags';
import { getSignedKeyListWithDeferredPublish } from '@proton/shared/lib/keys/signedKeyList';

import { disconnectBYOEAddress, reconnectBYOEAddress } from '../api/api';

export const updateBYOEAddressConnection = ({
    address: initialAddress,
    type,
    skipDisable = false,
}: {
    address: Address;
    type: 'disconnect' | 'reconnect';
    skipDisable?: boolean;
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

        // Set address flags
        const { SignedKeyList: currentSignedKeyList } = address;
        const addressKeys = await dispatch(addressKeysThunk({ addressID: address.ID }));

        const activeKeys = await getActiveAddressKeys(currentSignedKeyList, addressKeys);

        const setFlags = <V extends ActiveKeyWithVersion>(activeKey: V) => ({
            ...activeKey,
            flags: getNewAddressKeyFlags(
                getNewAddressKeyFlags(
                    activeKey.flags,
                    type === 'disconnect' ? FlagAction.DISABLE_ENCRYPTION : FlagAction.ENABLE_ENCRYPTION
                ),
                type === 'disconnect' ? FlagAction.DISABLE_EXPECT_SIGNED : FlagAction.ENABLE_EXPECT_SIGNED
            ),
        });
        const newActiveKeys = getNormalizedActiveAddressKeys(address, {
            v4: activeKeys.v4.map(setFlags),
            v6: activeKeys.v6.map(setFlags),
        });
        const [newSignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
            newActiveKeys,
            address,
            keyTransparencyVerify
        );

        if (type === 'disconnect') {
            await api(disconnectBYOEAddress(address.ID, newSignedKeyList));
            if (!skipDisable) {
                await api(disableAddress(address.ID));
            }
        } else {
            await api(reconnectBYOEAddress(address.ID, newSignedKeyList));
        }

        await onSKLPublishSuccess();

        return dispatch(addressThunk({ address, cache: CacheType.None }));
    };
};
