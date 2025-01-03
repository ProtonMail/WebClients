import { put, takeEvery } from 'redux-saga/effects';

import { trashItems } from '@proton/pass/lib/items/item.requests';
import { itemTrashFailure, itemTrashIntent, itemTrashSuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* trashItemWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload }: WithSenderAction<ReturnType<typeof itemTrashIntent>>
) {
    const { item, shareId } = payload;

    try {
        yield trashItems([item]);
        yield put(itemTrashSuccess({ itemId: item.itemId, shareId }));
        onItemsUpdated?.();
    } catch (e) {
        yield put(itemTrashFailure({ itemId: item.itemId, shareId }, e));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemTrashIntent.match, trashItemWorker, options);
}
