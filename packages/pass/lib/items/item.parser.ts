import type { ItemRevision, ItemRevisionContentsResponse, ItemType } from '../../types';
import { PassCrypto } from '../crypto';
import { parseOpenedItem } from './item-proto.transformer';

export const parseItemRevision = async <T extends ItemType = ItemType>(
    shareId: string,
    encryptedItem: ItemRevisionContentsResponse
): Promise<ItemRevision<T>> => {
    const openedItem = await PassCrypto.openItem({ shareId, encryptedItem });
    return parseOpenedItem({ openedItem, shareId }) as ItemRevision<T>;
};
