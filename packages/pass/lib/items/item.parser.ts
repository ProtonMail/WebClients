import type { ItemRevisionContentsResponse } from '../../types/api/pass';
import type { ItemRevision } from '../../types/data/items';
import type { ItemType } from '../../types/protobuf';
import { PassCrypto } from '../crypto';
import { parseOpenedItem } from './item-proto.transformer';

export const parseItemRevision = async <T extends ItemType = ItemType>(
    shareId: string,
    encryptedItem: ItemRevisionContentsResponse
): Promise<ItemRevision<T>> => {
    const openedItem = await PassCrypto.openItem({ shareId, encryptedItem });
    return parseOpenedItem({ openedItem, shareId }) as ItemRevision<T>;
};
