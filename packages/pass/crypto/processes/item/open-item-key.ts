import type { ItemKey, ItemKeyResponse, VaultKey } from '@proton/pass/types';
import { EncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData, getSymmetricKey } from '../../utils/crypto-helpers';

type OpenVaultKeyProcessParams = {
    encryptedItemKey: ItemKeyResponse;
    vaultKey: VaultKey;
};

export const openItemKey = async ({
    encryptedItemKey: { Key, KeyRotation },
    vaultKey,
}: OpenVaultKeyProcessParams): Promise<ItemKey> => {
    const data = base64StringToUint8Array(Key);
    const itemKey = await decryptData(vaultKey.key, data, EncryptionTag.ItemKey);

    return {
        raw: itemKey,
        key: await getSymmetricKey(itemKey),
        rotation: KeyRotation,
    };
};
