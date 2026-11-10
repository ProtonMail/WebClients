import { all, put, select, take, takeEvery } from 'redux-saga/effects';

import type { ItemRevision } from '../../../types/data/items';
import {
    lockShare,
    unlockShare,
    vaultMoveAllItemsFailure,
    vaultMoveAllItemsIntent,
    vaultMoveAllItemsProgress,
    vaultMoveAllItemsSuccess,
} from '../../actions/creators/vault';
import { selectItemsInFolder } from '../../selectors/items';
import { isShareLocked, selectShareOrThrow } from '../../selectors/shares';
import { type BulkMoveItemsChannel, bulkMoveChannel } from '../items/item-bulk-move.saga';

function* moveAllItemsWorker({ payload, meta }: ReturnType<typeof vaultMoveAllItemsIntent>) {
    const { shareId, content, targetShareId, targetFolderId } = payload;

    /** A folder destination can be inside the source vault: locking the same
     * share twice would also unlock it twice and free a lock taken meanwhile */
    const lockedShareIds = [...new Set([shareId, targetShareId])];

    try {
        const sharesLocked: boolean[] = yield all(lockedShareIds.map((id) => select(isShareLocked(id))));
        if (sharesLocked.some(Boolean)) throw new Error();

        yield all(lockedShareIds.map((id) => select(selectShareOrThrow(id))));

        yield all(lockedShareIds.map((id) => put(lockShare(id))));

        const itemsToMove: ItemRevision[] = yield select(selectItemsInFolder(shareId, null));
        const channel = bulkMoveChannel(itemsToMove, { targetShareId, targetFolderId });

        while (true) {
            const action: BulkMoveItemsChannel = yield take(channel);

            if (action.type === 'progress') {
                const { progress, data } = action;
                yield put(vaultMoveAllItemsProgress(meta.request.id, progress, { ...data, targetShareId }));
            }

            if (action.type === 'done') yield put(vaultMoveAllItemsSuccess(meta.request.id, { content }));
            if (action.type === 'error') yield put(vaultMoveAllItemsFailure(meta.request.id, payload, action.error));
        }
    } catch (error) {
        yield put(vaultMoveAllItemsFailure(meta.request.id, payload, error));
    } finally {
        yield all(lockedShareIds.map((id) => put(unlockShare(id))));
    }
}

export default function* watcher() {
    yield takeEvery(vaultMoveAllItemsIntent.match, moveAllItemsWorker);
}
