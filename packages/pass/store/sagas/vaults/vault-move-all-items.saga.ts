import { put, select, take, takeEvery } from 'redux-saga/effects';

import type { ItemRevision } from '../../../types';
import {
    lockShare,
    unlockShare,
    vaultMoveAllItemsFailure,
    vaultMoveAllItemsIntent,
    vaultMoveAllItemsProgress,
    vaultMoveAllItemsSuccess,
} from '../../actions';
import { isShareLocked, selectItemsByShareId } from '../../selectors';
import { type BulkMoveItemsChannel, bulkMoveChannel } from '../items/item-bulk-move.saga';

function* moveAllItemsWorker({ payload, meta }: ReturnType<typeof vaultMoveAllItemsIntent>) {
    const { shareId, content, targetShareId } = payload;

    try {
        const shareLocked: boolean = yield select(isShareLocked(shareId));
        const targetShareLocked: boolean = yield select(isShareLocked(targetShareId));
        if (shareLocked || targetShareLocked) throw new Error();

        yield put(lockShare(shareId));
        yield put(lockShare(targetShareId));

        const itemsToMove: ItemRevision[] = yield select(selectItemsByShareId(shareId));
        const channel = bulkMoveChannel(itemsToMove, targetShareId);

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
        yield put(unlockShare(shareId));
        yield put(unlockShare(targetShareId));
    }
}

export default function* watcher() {
    yield takeEvery(vaultMoveAllItemsIntent.match, moveAllItemsWorker);
}
