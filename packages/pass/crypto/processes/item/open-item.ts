import type { ItemRevisionContentsResponse, OpenedItem, VaultKey } from '@proton/pass/types';
import { EncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { decryptData } from '../../utils/crypto-helpers';
import { PassCryptoItemError } from '../../utils/errors';
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
        EncryptionTag.ItemContent
    );

    return {
        itemId: encryptedItem.ItemID,
        revision: encryptedItem.Revision,
        contentFormatVersion: encryptedItem.ContentFormatVersion,
        state: encryptedItem.State,
        content: decryptedContent,
        aliasEmail: encryptedItem.AliasEmail ?? null,
        createTime: encryptedItem.CreateTime,
        revisionTime: encryptedItem.RevisionTime,
        modifyTime: encryptedItem.ModifyTime,
        lastUseTime: encryptedItem.LastUseTime ?? null,
    };
};
