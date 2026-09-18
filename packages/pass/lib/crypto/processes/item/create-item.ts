import type { ItemCreateRequest, MaybeNull, RotationKey } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { pipe } from '../../../../utils/fp/pipe';
import { encryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
import { validateItemContentSize } from '../../utils/validators';

type CreateItemProcessParams = {
    content: Uint8Array<ArrayBuffer>;
    /** Key used to encrypt the generated ItemKey: VaultKey if the item
     * is at the vault root, or the parent FolderKey if in a folder */
    encryptionKey: RotationKey;
    folderId?: MaybeNull<string>;
};

export const createItem = async ({
    content,
    encryptionKey,
    folderId = null,
}: CreateItemProcessParams): Promise<ItemCreateRequest> => {
    if (content.length === 0) {
        throw new PassCryptoItemError('Item content cannot be empty');
    }

    const key = generateKey();
    const itemKey = await importSymmetricKey(key);
    const encryptedItemContent = await encryptData(itemKey, content, PassEncryptionTag.ItemContent);
    const encryptedItemKey = await encryptData(encryptionKey.key, key, PassEncryptionTag.ItemKey);

    return {
        Content: pipe((bytes) => bytes.toBase64(), validateItemContentSize)(encryptedItemContent),
        ContentFormatVersion: ContentFormatVersion.Item,
        ItemKey: encryptedItemKey.toBase64(),
        KeyRotation: encryptionKey.rotation,
        FolderID: folderId,
    };
};
