import { PassCryptoItemError } from '@proton/pass/lib/crypto/utils/errors';
import type { ItemMoveSingleToShareRequest, VaultShareKey } from '@proton/pass/types';

import { createItem } from './create-item';

type MoveItemProcessParams = {
    destinationShareId: string;
    destinationVaultKey: VaultShareKey;
    content: Uint8Array;
};

export const moveItem = async ({
    destinationShareId,
    destinationVaultKey,
    content,
}: MoveItemProcessParams): Promise<ItemMoveSingleToShareRequest> => {
    if (content.length === 0) {
        throw new PassCryptoItemError('Item content cannot be empty');
    }

    return {
        Item: await createItem({ vaultKey: destinationVaultKey, content }),
        ShareID: destinationShareId,
        /* TODO: support adding an array of revisions to not lose history
         * after moving an item to another vault */
        History: [],
    };
};
