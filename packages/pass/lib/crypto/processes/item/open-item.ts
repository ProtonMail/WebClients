import { decryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import type { ItemRevisionContentsResponse, OpenedItem, VaultKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { openItemKey } from './open-item-key';

type OpenItemKeyProcessParams = {
    encryptedItem: ItemRevisionContentsResponse;
    vaultKey: VaultKey;
};

export const openItem = async ({ encryptedItem, vaultKey }: OpenItemKeyProcessParams): Promise<OpenedItem> => {
    if (!encryptedItem.ItemKey) {
        /**
         * TODO : If the item has no ItemKey then we're dealing with an ItemShare
         * where the ItemKey is stored in the share
         */
        throw new PassCryptoItemError('Unsupported operation : cannot open Item from ItemShare yet..');
    }

    if (vaultKey.rotation !== encryptedItem.KeyRotation) {
        throw new PassCryptoItemError(
            `Invalid vault key rotation : received ${vaultKey.rotation} / expected ${encryptedItem.KeyRotation}`
        );
    }

    const itemKey = await openItemKey({
        encryptedItemKey: { Key: encryptedItem.ItemKey!, KeyRotation: encryptedItem.KeyRotation! },
        vaultKey,
    });

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
    };
};
