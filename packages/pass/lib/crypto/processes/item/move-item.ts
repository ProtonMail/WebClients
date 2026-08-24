import type {
    EncodedItemKeyRotation,
    ItemKey,
    ItemMoveIndividualToShareRequest,
    VaultShareKey,
} from '../../../../types';
import { PassEncryptionTag } from '../../../../types';
import { encryptData } from '../../utils/crypto-helpers';

type MoveItemProcessParams = {
    itemId: string;
    itemKeys: ItemKey[];
    targetVaultKey: VaultShareKey;
};

export const moveItem = async ({
    itemId,
    itemKeys,
    targetVaultKey,
}: MoveItemProcessParams): Promise<ItemMoveIndividualToShareRequest> => {
    const vaultKey = targetVaultKey.key;

    const encryptedItemKeys = await Promise.all(
        itemKeys.map<Promise<EncodedItemKeyRotation>>(async ({ raw, rotation }) => {
            const encryptedKey = await encryptData(vaultKey, raw, PassEncryptionTag.ItemKey);

            return {
                Key: encryptedKey.toBase64(),
                KeyRotation: rotation,
            };
        })
    );

    return { ItemKeys: encryptedItemKeys, ItemID: itemId };
};
