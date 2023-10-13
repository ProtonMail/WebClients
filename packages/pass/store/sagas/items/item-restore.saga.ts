import { put, takeLatest } from 'redux-saga/effects';

import { restoreItems } from '@proton/pass/lib/items/item.requests';
import { itemRestoreFailure, itemRestoreIntent, itemRestoreSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* restoreItem(
    { onItemsChange }: WorkerRootSagaOptions,
    { payload, meta }: ReturnType<typeof itemRestoreIntent>
) {
    const { item, shareId } = payload;
    const { itemId } = item;
    const { callback: onItemRestoreProcessed } = meta;

    try {
        yield restoreItems([item]);
        const itemRestoreSuccessAction = itemRestoreSuccess({ itemId, shareId });
        yield put(itemRestoreSuccessAction);

        onItemRestoreProcessed?.(itemRestoreSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemRestoreFailureAction = itemRestoreFailure({ itemId, shareId }, e);
        yield put(itemRestoreFailureAction);
        onItemRestoreProcessed?.(itemRestoreFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLatest(itemRestoreIntent, restoreItem, options);
}
