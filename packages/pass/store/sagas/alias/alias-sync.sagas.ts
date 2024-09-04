import { put, select } from 'redux-saga/effects';

import {
    createAliasesFromPending,
    enableAliasSync,
    getAliasSyncStatus,
    getPendingAliases,
    toggleAliasStatus,
} from '@proton/pass/lib/alias/alias.requests';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { aliasSyncEnable, aliasSyncPending, aliasSyncStatus, aliasSyncStatusToggle } from '@proton/pass/store/actions';
import { userAccessRequest } from '@proton/pass/store/actions/requests';
import { requestInvalidate } from '@proton/pass/store/request/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectUserDefaultShareId } from '@proton/pass/store/selectors';
import type { AliasPending, ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

/* Will invalidate the `user-access` request as to re-request it
 * from the event channels soon as possible. */
const aliasSyncEnableSaga = createRequestSaga({
    actions: aliasSyncEnable,
    call: function* (DefaultShareID, { getAuthStore }) {
        yield enableAliasSync({ DefaultShareID });
        yield put(requestInvalidate(userAccessRequest(getAuthStore().getUserID()!)));

        return true;
    },
});

/** Gets all pending aliases from SimpleLogin and
 * attempts to create alias items for each of them */
const aliasSyncPendingSaga = createRequestSaga({
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

const aliasSyncStatusSaga = createRequestSaga({
    actions: aliasSyncStatus,
    call: getAliasSyncStatus,
});

const aliasSyncToggleStatusSaga = createRequestSaga({
    actions: aliasSyncStatusToggle,
    call: async ({ shareId, itemId, enabled: enable }) => {
        const encryptedItem = await toggleAliasStatus({ shareId, itemId, enabled: enable });
        if (!encryptedItem) throw new Error();

        const item = await parseItemRevision(shareId, encryptedItem);
        return { shareId, itemId, item };
    },
});

export default [aliasSyncEnableSaga, aliasSyncPendingSaga, aliasSyncStatusSaga, aliasSyncToggleStatusSaga];
