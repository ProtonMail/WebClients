import { select } from 'redux-saga/effects';

import { selectUserDefaultShareID } from '../../../store/selectors/user';
import type { ItemRevisionContentsResponse } from '../../../types/api/pass';
import type { AliasPending } from '../../../types/data/alias';
import type { ItemRevision } from '../../../types/data/items';
import type { Maybe } from '../../../types/utils';
import { NoDefaultVaultError } from '../../../utils/errors/errors';
import { logger } from '../../../utils/logger';
import { createAliasesFromPending, getPendingAliases } from '../../alias/alias.requests';
import { parseItemRevision } from '../../items/item.parser';

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
