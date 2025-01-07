import { getNewKeyFlags } from '@proton/components/containers/keys/shared/flags';
import { FlagAction } from '@proton/components/containers/keys/shared/interface';
import { updateAddressFlags } from '@proton/shared/lib/api/members';
import type {
    ActiveKeyWithVersion,
    Address,
    Api,
    DecryptedAddressKey,
    KeyTransparencyVerify,
} from '@proton/shared/lib/interfaces';
import { getSignedKeyListWithDeferredPublish } from '@proton/shared/lib/keys';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';

export const setAddressFlags = async ({
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
        flags: getNewKeyFlags(
            getNewKeyFlags(
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
