import type { EncodedItemKeyRotation, ItemMoveIndividualToShareRequest } from '../../../../types/api/pass';
import type { ItemKey, RotationKey } from '../../../../types/crypto/pass-types';
import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import type { MaybeNull } from '../../../../types/utils';
import { encryptData } from '../../utils/crypto-helpers';

type MoveItemProcessParams = {
    itemId: string;
    itemKeys: ItemKey[];
    targetKey: RotationKey;
    targetFolderId?: MaybeNull<string>;
};

export const moveItem = async ({
    itemId,
    itemKeys,
    targetKey,
    targetFolderId,
}: MoveItemProcessParams): Promise<ItemMoveIndividualToShareRequest> => {
    const encryptedItemKeys = await Promise.all(
        itemKeys.map<Promise<EncodedItemKeyRotation>>(async ({ raw, rotation }) => {
            const encryptedKey = await encryptData(targetKey.key, raw, PassEncryptionTag.ItemKey);

            return {
                Key: encryptedKey.toBase64(),
                KeyRotation: rotation,
            };
        })
    );

    return { ItemKeys: encryptedItemKeys, ItemID: itemId, DestinationFolderID: targetFolderId ?? null };
};
