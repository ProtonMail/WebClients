import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ItemKey, ItemRevisionContentsResponse, OpenedItem } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenItemKeyProcessParams = {
    encryptedItem: ItemRevisionContentsResponse;
    itemKey: ItemKey;
};

export const openItem = async ({ encryptedItem, itemKey }: OpenItemKeyProcessParams): Promise<OpenedItem> => {
    const decryptedContent = await decryptData(
        itemKey.key,
        base64StringToUint8Array(encryptedItem.Content),
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
