import { CONTENT_FORMAT_VERSION, EncryptionTag } from '@proton/pass/types';
import type { ItemKey, ItemUpdateRequest } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { encryptData } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';

type UpdateItemProcessParams = {
    itemKey: ItemKey;
    content: Uint8Array;
    lastRevision: number;
};

export const updateItem = async ({
    itemKey,
    content,
    lastRevision,
}: UpdateItemProcessParams): Promise<ItemUpdateRequest> => {
    if (content.length === 0) {
        throw new PassCryptoItemError('Item content cannot be empty');
    }

    const encryptedItemContent = await encryptData(itemKey.key, content, EncryptionTag.ItemContent);

    return {
        KeyRotation: itemKey.rotation,
        LastRevision: lastRevision,
        Content: uint8ArrayToBase64String(encryptedItemContent),
        ContentFormatVersion: CONTENT_FORMAT_VERSION,
    };
};
