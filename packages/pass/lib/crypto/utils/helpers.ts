import { PassCrypto } from '@proton/pass/lib/crypto';
import { getLatestItemKey } from '@proton/pass/lib/items/item.requests';
import type { ItemKey } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

/** Since we do not currently cache the item keys on the PassCrypto context
 * for items belonging to vault shares : resolve the latest key back-end side.
 * For item shares, resolve from the cached item share key*/
export const resolveItemKey = async (shareId: string, itemId: string): Promise<ItemKey> => {
    const manager = PassCrypto.getShareManager(shareId);

    switch (manager.getType()) {
        case ShareType.Vault:
            const encryptedItemKey = await getLatestItemKey(shareId, itemId);
            return PassCrypto.openItemKey({ encryptedItemKey, shareId });
        case ShareType.Item:
            const rotation = manager.getLatestRotation();
            return manager.getItemShareKey(rotation);
    }
};
