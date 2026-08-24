import { put, takeEvery } from 'redux-saga/effects';

import { pinItem } from '../../../lib/items/item.requests';
import { itemPinFailure, itemPinIntent, itemPinSuccess } from '../../actions';

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
