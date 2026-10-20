import { updateAddressFlags } from '../api/members';
import type { Address } from '../interfaces/Address';
import type { Api } from '../interfaces/Api';
import type { ActiveKeyWithVersion, DecryptedAddressKey } from '../interfaces/Key';
import type { KeyTransparencyVerify } from '../interfaces/KeyTransparency';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from './getActiveKeys';
import { FlagAction, getNewAddressKeyFlags } from './getNewAddressKeyFlags';
import { getSignedKeyListWithDeferredPublish } from './signedKeyList';

export const setAddressFlagsHelper = async ({
    encryptionDisabled,
    expectSignatureDisabled,
    address,
    keyTransparencyVerify,
    api,
    addressKeys,
}: {
    encryptionDisabled: boolean;
    expectSignatureDisabled: boolean;
    address: Address;
    keyTransparencyVerify: KeyTransparencyVerify;
    api: Api;
    addressKeys: DecryptedAddressKey[];
}): Promise<void> => {
    const { SignedKeyList: currentSignedKeyList } = address;

    const activeKeys = await getActiveAddressKeys(currentSignedKeyList, addressKeys);

    const setFlags = <V extends ActiveKeyWithVersion>(activeKey: V) => ({
        ...activeKey,
        flags: getNewAddressKeyFlags(
            getNewAddressKeyFlags(
                activeKey.flags,
                encryptionDisabled ? FlagAction.DISABLE_ENCRYPTION : FlagAction.ENABLE_ENCRYPTION
            ),
            expectSignatureDisabled ? FlagAction.DISABLE_EXPECT_SIGNED : FlagAction.ENABLE_EXPECT_SIGNED
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

    await api(updateAddressFlags(address.ID, !encryptionDisabled, !expectSignatureDisabled, newSignedKeyList));

    await onSKLPublishSuccess();
};
