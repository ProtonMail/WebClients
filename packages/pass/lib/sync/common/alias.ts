import { select } from 'redux-saga/effects';

import { createAliasesFromPending, getPendingAliases } from '@proton/pass/lib/alias/alias.requests';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { selectUserDefaultShareID } from '@proton/pass/store/selectors';
import type { AliasPending, ItemRevision, ItemRevisionContentsResponse, Maybe } from '@proton/pass/types';
import { NoDefaultVaultError } from '@proton/pass/utils/errors/errors';
import { logger } from '@proton/pass/utils/logger';

export function* syncPendingAliases(): Generator<unknown, ItemRevision[]> {
    try {
        const shareId: Maybe<string> = yield select(selectUserDefaultShareID);
        if (!shareId) throw new NoDefaultVaultError('Missing default vault for pending aliases');

        const pendingAliases: AliasPending[] = yield getPendingAliases();
        const encryptedItems: ItemRevisionContentsResponse[] = yield createAliasesFromPending({
            shareId,
            pendingAliases,
        });

        const items: ItemRevision[] = yield Promise.all(encryptedItems.map(parseItemRevision.bind(null, shareId)));
        return items;
    } catch (error) {
        logger.warn('[SL::Sync] Failed to create pending aliases', error);
        throw error;
    }
}
