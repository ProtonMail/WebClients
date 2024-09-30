import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ItemKey, ItemKeyResponse, VaultKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenItemKeyProcessParams = {
    encryptedItemKey: ItemKeyResponse;
    vaultKey: VaultKey;
};

export const openItemKey = async ({
    encryptedItemKey: { Key, KeyRotation },
    vaultKey,
}: OpenItemKeyProcessParams): Promise<ItemKey> => {
    const data = base64StringToUint8Array(Key);
    const itemKey = await decryptData(vaultKey.key, data, PassEncryptionTag.ItemKey);

    return {
        raw: itemKey,
        key: await importSymmetricKey(itemKey),
        rotation: KeyRotation,
    };
};
