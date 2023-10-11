import { put, takeEvery } from 'redux-saga/effects';

import { moveItem } from '@proton/pass/lib/items/item.requests';
import { itemMoveFailure, itemMoveIntent, itemMoveSuccess } from '@proton/pass/store/actions';
import type { ItemRevision } from '@proton/pass/types';

function* itemCreationWorker({ payload }: ReturnType<typeof itemMoveIntent>) {
    const { item: itemToMove, optimisticId, shareId } = payload;

    try {
        const item: ItemRevision = yield moveItem(itemToMove, itemToMove.shareId, shareId);
        yield put(itemMoveSuccess({ item, optimisticId, shareId }));
    } catch (e: unknown) {
        yield put(itemMoveFailure({ optimisticId, shareId, item: itemToMove }, e));
    }
}

export default function* watcher() {
    yield takeEvery(itemMoveIntent.match, itemCreationWorker);
}
