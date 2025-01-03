import { put, takeLatest } from 'redux-saga/effects';

import { restoreItems } from '@proton/pass/lib/items/item.requests';
import { itemRestoreFailure, itemRestoreIntent, itemRestoreSuccess } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* restoreItem({ onItemsUpdated }: RootSagaOptions, { payload }: ReturnType<typeof itemRestoreIntent>) {
    const { item, shareId } = payload;
    const { itemId } = item;

    try {
        yield restoreItems([item]);
        yield put(itemRestoreSuccess({ itemId, shareId }));
        onItemsUpdated?.();
    } catch (e) {
        yield put(itemRestoreFailure({ itemId, shareId }, e));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(itemRestoreIntent, restoreItem, options);
}
