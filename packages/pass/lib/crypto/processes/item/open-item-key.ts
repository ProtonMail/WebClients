import type { EncodedItemKeyRotation, ItemKey, ShareKey } from '../../../../types';
import { PassEncryptionTag } from '../../../../types';
import { decryptData, importSymmetricKey } from '../../utils/crypto-helpers';

type OpenItemKeyProcessParams = {
    encryptedItemKey: EncodedItemKeyRotation;
    shareKey: ShareKey;
};

export const openItemKey = async ({
    encryptedItemKey: { Key, KeyRotation },
    shareKey,
}: OpenItemKeyProcessParams): Promise<ItemKey> => {
    const data = Uint8Array.fromBase64(Key);
    const itemKey = await decryptData(shareKey.key, data, PassEncryptionTag.ItemKey);
    const key = await importSymmetricKey(itemKey);

    return { raw: itemKey, key, rotation: KeyRotation };
};
