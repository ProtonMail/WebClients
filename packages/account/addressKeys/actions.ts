import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { disconnectBYOEAddress, reconnectBYOEAddress } from '@proton/activation/src/api';
import { createKTVerifier } from '@proton/key-transparency/helpers';
import { isMultiUserPersonalPlan } from '@proton/payments/core/plan/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { disableAddress } from '@proton/shared/lib/api/addresses';
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
import { type OrganizationState, organizationThunk } from '../organization';

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
    type: 'disconnect' | 'reconnect';
    member?: Member;
    skipDisable?: boolean;
}): ThunkAction<
    Promise<Address | undefined>,
    AddressKeysState & KtState & MembersState & OrganizationState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        if (!initialAddress) {
            throw new Error('No address provided');
        }
        const api = getSilentApi(extra.api);

        // A multi-user personal (B2C, e.g. Family) plan has no organisation key, so an admin cannot access the
        // member's keys to rebuild their signed key list, meaning a true disconnect (key flags + SKL + KT) is
        // impossible. Instead the admin disables the member's address, which needs the address ID alone.
        const isActingOnMember = !!member && !member.Self;
        if (isActingOnMember) {
            const organization = await dispatch(organizationThunk());
            const isB2CPlan = !!organization.PlanName && isMultiUserPersonalPlan(organization.PlanName);
            if (isB2CPlan && type === 'disconnect') {
                await api(disableAddress(initialAddress.ID));
                // Refresh the member's addresses so the disabled status is reflected in the UI.
                const memberAddresses = await dispatch(
                    getMemberAddresses({ member, cache: CacheType.None, retry: true })
                );
                return memberAddresses.find((otherAddress) => otherAddress.ID === initialAddress.ID);
            }
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
