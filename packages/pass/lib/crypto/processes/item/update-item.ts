import type { ItemKey, ItemUpdateRequest } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { pipe } from '../../../../utils/fp/pipe';
import { encryptData } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { validateItemContentSize } from '../../utils/validators';

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
        Content: pipe((bytes) => bytes.toBase64(), validateItemContentSize)(encryptedItemContent),
        ContentFormatVersion: ContentFormatVersion.Item,
    };
};
