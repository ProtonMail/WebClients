import { put, takeEvery } from 'redux-saga/effects';

import { pinItem } from '@proton/pass/lib/items/item.requests';
import { itemPinFailure, itemPinIntent, itemPinSuccess } from '@proton/pass/store/actions';

function* itemPinWorker({ payload, meta: { request } }: ReturnType<typeof itemPinIntent>) {
    try {
        yield pinItem(payload.shareId, payload.itemId);
        yield put(itemPinSuccess(request.id, payload));
    } catch (err) {
        yield put(itemPinFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(itemPinIntent.match, itemPinWorker);
}
