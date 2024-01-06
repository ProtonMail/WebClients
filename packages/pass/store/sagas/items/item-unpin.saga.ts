import { put, takeEvery } from 'redux-saga/effects';

import { unpinItem } from '@proton/pass/lib/items/item.requests';
import { itemUnpinFailure, itemUnpinIntent, itemUnpinSuccess } from '@proton/pass/store/actions';

function* itemUnpinWorker({ payload, meta: { request } }: ReturnType<typeof itemUnpinIntent>) {
    try {
        yield unpinItem(payload.shareId, payload.itemId);
        yield put(itemUnpinSuccess(request.id, payload));
    } catch (err) {
        yield put(itemUnpinFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(itemUnpinIntent.match, itemUnpinWorker);
}
