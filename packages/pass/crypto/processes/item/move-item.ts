import type { ItemMoveSingleToShareRequest, VaultKey } from '@proton/pass/types';

import { PassCryptoItemError } from '../../utils/errors';
import { createItem } from './create-item';

type MoveItemProcessParams = {
    destinationShareId: string;
    destinationVaultKey: VaultKey;
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
    };
};
