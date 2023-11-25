import { put, select, takeEvery } from 'redux-saga/effects';

import { moveItems } from '@proton/pass/lib/items/item.requests';
import {
    vaultMoveAllItemsFailure,
    vaultMoveAllItemsIntent,
    vaultMoveAllItemsSuccess,
} from '@proton/pass/store/actions';
import { selectItemsByShareId } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* moveAllItemsWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload: { shareId, content, destinationShareId }, meta }: ReturnType<typeof vaultMoveAllItemsIntent>
) {
    try {
        const items: ItemRevision[] = yield select(selectItemsByShareId(shareId));
        const movedItems = (yield moveItems(items, destinationShareId)) as ItemRevision[];

        yield put(vaultMoveAllItemsSuccess(meta.request.id, { shareId, destinationShareId, content, movedItems }));
        onItemsUpdated?.();
    } catch (e) {
        yield put(vaultMoveAllItemsFailure(meta.request.id, { shareId, content }, e));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(vaultMoveAllItemsIntent.match, moveAllItemsWorker, options);
}
