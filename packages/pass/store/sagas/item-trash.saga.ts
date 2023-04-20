import { put, takeEvery } from 'redux-saga/effects';

import { itemTrashFailure, itemTrashIntent, itemTrashSuccess } from '../actions';
import { WorkerRootSagaOptions } from '../types';
import { trashItem } from './workers/items';

function* trashItemWorker(
    { onItemsChange }: WorkerRootSagaOptions,
    { payload, meta }: ReturnType<typeof itemTrashIntent>
) {
    const { item, shareId } = payload;
    const { callback: onItemTrashProcessed } = meta;

    try {
        yield trashItem(payload.item);
        const itemTrashSuccessAction = itemTrashSuccess({ itemId: item.itemId, shareId });
        yield put(itemTrashSuccessAction);

        onItemTrashProcessed?.(itemTrashSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemTrashFailureAction = itemTrashFailure({ itemId: item.itemId, shareId }, e);
        yield put(itemTrashFailureAction);

        onItemTrashProcessed?.(itemTrashFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(itemTrashIntent.match, trashItemWorker, options);
}
