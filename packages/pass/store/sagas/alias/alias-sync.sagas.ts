import { put } from 'redux-saga/effects';

import { enableAliasSync, getAliasSyncStatus, toggleAliasStatus } from '@proton/pass/lib/alias/alias.requests';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { syncPendingAliases } from '@proton/pass/lib/sync/common/alias';
import { aliasPendingCreate, aliasSyncEnable, aliasSyncStatus, aliasSyncStatusToggle } from '@proton/pass/store/actions';
import { userAccessRequest } from '@proton/pass/store/actions/requests';
import { requestInvalidate } from '@proton/pass/store/request/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

/* Will invalidate the `user-access` request as to re-request it
 * from the event channels soon as possible. */
const aliasSyncEnableSaga = createRequestSaga({
    actions: aliasSyncEnable,
    call: function* (DefaultShareID, { getAuthStore }) {
        yield enableAliasSync({ DefaultShareID });
        yield put(requestInvalidate(userAccessRequest(getAuthStore().getUserID()!)));

        return DefaultShareID;
    },
});

/** Gets all pending aliases from SimpleLogin and
 * attempts to create alias items for each of them */
const aliasSyncPendingSaga = createRequestSaga({
    actions: aliasPendingCreate,
    call: syncPendingAliases,
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
