import { put, select, take, takeEvery } from 'redux-saga/effects';

import {
    vaultMoveAllItemsFailure,
    vaultMoveAllItemsIntent,
    vaultMoveAllItemsProgress,
    vaultMoveAllItemsSuccess,
} from '@proton/pass/store/actions';
import { type BulkMoveItemsChannel, bulkMoveChannel } from '@proton/pass/store/sagas/items/item-bulk-move.saga';
import { selectItemsByShareId } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* moveAllItemsWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof vaultMoveAllItemsIntent>
) {
    const { shareId, content, targetShareId } = payload;
    const itemsToMove: ItemRevision[] = yield select(selectItemsByShareId(shareId));
    const channel = bulkMoveChannel(itemsToMove, targetShareId);

    while (true) {
        const action: BulkMoveItemsChannel = yield take(channel);

        if (action.type === 'progress') {
            yield put(
                vaultMoveAllItemsProgress(meta.request.id, action.progress, {
                    ...action.data,
                    targetShareId,
                })
            );
            onItemsUpdated?.();
        }

        if (action.type === 'done') yield put(vaultMoveAllItemsSuccess(meta.request.id, { content }));
        if (action.type === 'error') yield put(vaultMoveAllItemsFailure(meta.request.id, payload, action.error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(vaultMoveAllItemsIntent.match, moveAllItemsWorker, options);
}
