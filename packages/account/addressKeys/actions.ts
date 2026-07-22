import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { disconnectBYOEAddress, reconnectBYOEAddress } from '@proton/activation/src/api';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { disableAddress, enableAddress } from '@proton/shared/lib/api/addresses';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ActiveKeyWithVersion, Address, Member } from '@proton/shared/lib/interfaces';
import { setAddressFlagsHelper } from '@proton/shared/lib/keys/addressFlagsHelper';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { FlagAction, getNewAddressKeyFlags } from '@proton/shared/lib/keys/getNewAddressKeyFlags';
import { getSignedKeyListWithDeferredPublish } from '@proton/shared/lib/keys/signedKeyList';

import type { KtState } from '..//kt';
import { type AddressKeysState, addressKeysThunk } from '../addressKeys/index';
import { addressThunk, addressesThunk } from '../addresses';
import { getKTActivation } from '../kt/actions';
import { type MembersState, getMemberAddresses } from '../members';

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

export const updateBYOEAddressConnection = ({
    address: initialAddress,
    type,
    member,
    skipDisable = false,
}: {
    address: Address;
    type: 'disconnect' | 'reconnect' | 'enable' | 'disable';
    member?: Member;
    skipDisable?: boolean;
}): ThunkAction<
    Promise<Address | undefined>,
    AddressKeysState & KtState & MembersState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        if (!initialAddress) {
            throw new Error('No address provided');
        }
        const api = getSilentApi(extra.api);

        // Enable/disable are the admin-on-member actions on a multi-user personal (B2C) plan. There is no
        // organisation key, so the admin cannot rebuild the member's signed key list: these do no key/SKL/KT
        // work. Disable turns the address off by ID; enable re-enables it through the backend reconnect endpoint.
        if (type === 'disable' || type === 'enable') {
            if (type === 'disable') {
                await api(disableAddress(initialAddress.ID));
            } else {
                await api(enableAddress(initialAddress.ID));
            }
            // Refresh the member's addresses so the new status is reflected in the UI.
            if (member) {
                const memberAddresses = await dispatch(
                    getMemberAddresses({ member, cache: CacheType.None, retry: true })
                );
                return memberAddresses.find((otherAddress) => otherAddress.ID === initialAddress.ID);
            }
            return dispatch(addressThunk({ address: initialAddress, cache: CacheType.None }));
        }

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
