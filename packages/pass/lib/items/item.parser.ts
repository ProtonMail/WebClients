import { PassCrypto } from '@proton/pass/lib/crypto';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';

import { parseOpenedItem } from './item-proto.transformer';

export const parseItemRevision = async (
    shareId: string,
    encryptedItem: ItemRevisionContentsResponse
): Promise<ItemRevision> => {
    const openedItem = await PassCrypto.openItem({ shareId, encryptedItem });
    return parseOpenedItem({ openedItem, shareId });
};
