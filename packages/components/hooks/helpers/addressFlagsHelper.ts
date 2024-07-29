import { getNewKeyFlags } from '@proton/components/containers/keys/shared/flags';
import { FlagAction } from '@proton/components/containers/keys/shared/interface';
import { updateAddressFlags } from '@proton/shared/lib/api/members';
import type { Address, Api, DecryptedAddressKey, KeyTransparencyVerify } from '@proton/shared/lib/interfaces';
import { getSignedKeyListWithDeferredPublish } from '@proton/shared/lib/keys';
import { getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';

export const setAddressFlags = async ({
    encryptionDisabled,
    expectSignatureDisabled,
    address,
    keyTransparencyVerify,
    api,
    addressesKeys,
}: {
    encryptionDisabled: boolean;
    expectSignatureDisabled: boolean;
    address: Address;
    keyTransparencyVerify: KeyTransparencyVerify;
    api: Api;
    addressesKeys?: {
        address: Address;
        keys: DecryptedAddressKey[];
    }[];
}): Promise<void> => {
    const { ID: addressID, SignedKeyList: currentSignedKeyList, Keys: currentKeys } = address;
    const addressWithKeys = addressesKeys?.find(({ address: { ID } }) => ID === addressID);
    if (addressWithKeys === undefined) {
        throw new Error('addressWithKeys is undefined!');
    }

    const { keys } = addressWithKeys;

    const activeKeys = await getActiveKeys(address, currentSignedKeyList, currentKeys, keys);
    const newActiveKeys = getNormalizedActiveKeys(
        address,
        activeKeys.map((activeKey) => ({
            ...activeKey,
            flags: getNewKeyFlags(
                getNewKeyFlags(
                    activeKey.flags,
                    encryptionDisabled ? FlagAction.DISABLE_ENCRYPTION : FlagAction.ENABLE_ENCRYPTION
                ),
                expectSignatureDisabled ? FlagAction.DISABLE_EXPECT_SIGNED : FlagAction.ENABLE_EXPECT_SIGNED
            ),
        }))
    );
    const [newSignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        newActiveKeys,
        address,
        keyTransparencyVerify
    );
    await api(updateAddressFlags(address.ID, !encryptionDisabled, !expectSignatureDisabled, newSignedKeyList));
    await onSKLPublishSuccess();
};
