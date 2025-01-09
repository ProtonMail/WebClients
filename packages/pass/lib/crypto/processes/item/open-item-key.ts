import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { EncodedItemKeyRotation, ItemKey, VaultShareKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenItemKeyProcessParams = {
    encryptedItemKey: EncodedItemKeyRotation;
    vaultKey: VaultShareKey;
};

export const openItemKey = async ({
    encryptedItemKey: { Key, KeyRotation },
    vaultKey,
}: OpenItemKeyProcessParams): Promise<ItemKey> => {
    const data = base64StringToUint8Array(Key);
    const itemKey = await decryptData(vaultKey.key, data, PassEncryptionTag.ItemKey);
    const key = await importSymmetricKey(itemKey);

    return { raw: itemKey, key, rotation: KeyRotation };
};
