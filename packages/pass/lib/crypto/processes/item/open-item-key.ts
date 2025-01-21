import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { EncodedItemKeyRotation, ItemKey, ShareKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenItemKeyProcessParams = {
    encryptedItemKey: EncodedItemKeyRotation;
    shareKey: ShareKey;
};

export const openItemKey = async ({
    encryptedItemKey: { Key, KeyRotation },
    shareKey,
}: OpenItemKeyProcessParams): Promise<ItemKey> => {
    const data = base64StringToUint8Array(Key);
    const itemKey = await decryptData(shareKey.key, data, PassEncryptionTag.ItemKey);
    const key = await importSymmetricKey(itemKey);

    return { raw: itemKey, key, rotation: KeyRotation };
};
