import { put, takeEvery } from 'redux-saga/effects';

import { trashItems } from '@proton/pass/lib/items/item.requests';
import { itemTrashFailure, itemTrashIntent, itemTrashSuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* trashItemWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: WithSenderAction<ReturnType<typeof itemTrashIntent>>
) {
    const { item, shareId } = payload;
    const { callback: onItemTrashProcessed } = meta;

    try {
        yield trashItems([item]);
        const itemTrashSuccessAction = itemTrashSuccess({ itemId: item.itemId, shareId });
        yield put(itemTrashSuccessAction);

        onItemTrashProcessed?.(itemTrashSuccessAction);
        onItemsUpdated?.();
    } catch (e) {
        const itemTrashFailureAction = itemTrashFailure({ itemId: item.itemId, shareId }, e);
        yield put(itemTrashFailureAction);

        onItemTrashProcessed?.(itemTrashFailureAction);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemTrashIntent.match, trashItemWorker, options);
}
