import type { ItemCreateRequest, VaultKey } from '@proton/pass/types';
import { CONTENT_FORMAT_VERSION, EncryptionTag } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { encryptData, generateKey, getSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { validateItemContentSize } from '../../utils/validators';

type CreateItemProcessParams = {
    content: Uint8Array;
    vaultKey: VaultKey;
};

export const createItem = async ({ content, vaultKey }: CreateItemProcessParams): Promise<ItemCreateRequest> => {
    if (content.length === 0) {
        throw new PassCryptoItemError('Item content cannot be empty');
    }

    const key = generateKey();
    const itemKey = await getSymmetricKey(key);
    const encryptedItemContent = await encryptData(itemKey, content, EncryptionTag.ItemContent);
    const encryptedItemKey = await encryptData(vaultKey.key, key, EncryptionTag.ItemKey);

    return {
        Content: pipe(uint8ArrayToBase64String, validateItemContentSize)(encryptedItemContent),
        ContentFormatVersion: CONTENT_FORMAT_VERSION,
        ItemKey: uint8ArrayToBase64String(encryptedItemKey),
        KeyRotation: vaultKey.rotation,
    };
};
