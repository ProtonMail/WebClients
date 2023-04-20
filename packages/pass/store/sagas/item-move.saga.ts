import { put, takeEvery } from 'redux-saga/effects';

import type { ItemRevision } from '@proton/pass/types';

import { itemMoveFailure, itemMoveIntent, itemMoveSuccess } from '../actions';
import { moveItem } from './workers/items';

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
