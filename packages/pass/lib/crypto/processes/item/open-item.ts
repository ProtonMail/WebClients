import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import type { ItemKey, ItemRevisionContentsResponse, OpenedItem } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';

type OpenItemKeyProcessParams = {
    encryptedItem: ItemRevisionContentsResponse;
    itemKey: ItemKey;
};

export const openItem = async ({ encryptedItem, itemKey }: OpenItemKeyProcessParams): Promise<OpenedItem> => {
    if (itemKey.rotation !== encryptedItem.KeyRotation) {
        throw new PassCryptoItemError(
            `Invalid key rotation : received ${itemKey.rotation} / expected ${encryptedItem.KeyRotation}`
        );
    }

    const decryptedContent = await decryptData(
        itemKey.key,
        Uint8Array.fromBase64(encryptedItem.Content),
        PassEncryptionTag.ItemContent
    );

    return {
        aliasEmail: encryptedItem.AliasEmail ?? null,
        content: decryptedContent,
        contentFormatVersion: encryptedItem.ContentFormatVersion,
        createTime: encryptedItem.CreateTime,
        flags: encryptedItem.Flags,
        itemId: encryptedItem.ItemID,
        lastUseTime: encryptedItem.LastUseTime ?? null,
        modifyTime: encryptedItem.ModifyTime,
        pinned: encryptedItem.Pinned ?? false,
        revision: encryptedItem.Revision,
        revisionTime: encryptedItem.RevisionTime,
        state: encryptedItem.State,
        shareCount: encryptedItem.ShareCount,
    };
};
