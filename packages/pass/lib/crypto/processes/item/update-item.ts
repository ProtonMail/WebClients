import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import { validateItemContentSize } from '@proton/pass/lib/crypto/utils/validators';
import type { ItemKey, ItemUpdateRequest } from '@proton/pass/types';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

type UpdateItemProcessParams = {
    itemKey: ItemKey;
    content: Uint8Array<ArrayBuffer>;
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

    const encryptedItemContent = await encryptData(itemKey.key, content, PassEncryptionTag.ItemContent);

    return {
        KeyRotation: itemKey.rotation,
        LastRevision: lastRevision,
        Content: pipe(uint8ArrayToBase64String, validateItemContentSize)(encryptedItemContent),
        ContentFormatVersion: ContentFormatVersion.Item,
    };
};
