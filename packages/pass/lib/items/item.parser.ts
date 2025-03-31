import { PassCrypto } from '@proton/pass/lib/crypto';
import type { ItemRevision, ItemRevisionContentsResponse, ItemType } from '@proton/pass/types';

import { parseOpenedItem } from './item-proto.transformer';

export const parseItemRevision = async <T extends ItemType = ItemType>(
    shareId: string,
    encryptedItem: ItemRevisionContentsResponse
): Promise<ItemRevision<T>> => {
    const openedItem = await PassCrypto.openItem({ shareId, encryptedItem });
    return parseOpenedItem({ openedItem, shareId }) as ItemRevision<T>;
};
