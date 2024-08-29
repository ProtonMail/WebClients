import { select } from 'redux-saga/effects';

import { createAliasesFromPending, getPendingAliases } from '@proton/pass/lib/alias/alias.requests';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { aliasSyncPending } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectUserDefaultShareId } from '@proton/pass/store/selectors';
import type { AliasPending, ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

/** Gets all pending aliases from SimpleLogin and
 * attempts to create alias items for each of them */
export default createRequestSaga({
    actions: aliasSyncPending,
    call: function* () {
        try {
            const shareId: string = yield select(selectUserDefaultShareId);
            const pendingAliases: AliasPending[] = yield getPendingAliases();
            const encryptedItems: ItemRevisionContentsResponse[] = yield createAliasesFromPending({
                shareId,
                pendingAliases,
            });

            const items: ItemRevision[] = yield Promise.all(encryptedItems.map(parseItemRevision.bind(null, shareId)));
            return { items, shareId };
        } catch (error) {
            logger.warn('[SL::Sync] Failed to create pending aliases', error);
            throw error;
        }
    },
});
