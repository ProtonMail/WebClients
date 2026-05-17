import { put, select, take, takeLeading } from 'redux-saga/effects';

import { emptyTrashFailure, emptyTrashIntent, emptyTrashProgress, emptyTrashSuccess } from '@proton/pass/store/actions';
import { type BulkDeleteChannel, bulkDeleteChannel } from '@proton/pass/store/sagas/items/item-bulk-delete.saga';
import { selectTrashedItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';

function* emptyTrashWorker({ meta }: ReturnType<typeof emptyTrashIntent>) {
    const requestId = meta.request.id;
    const trashedItems: ItemRevision[] = yield select(selectTrashedItems);
    const progressChannel = bulkDeleteChannel(trashedItems);

    while (true) {
        const action: BulkDeleteChannel = yield take(progressChannel);

        if (action.type === 'progress') yield put(emptyTrashProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(emptyTrashSuccess(requestId));
        if (action.type === 'error') yield put(emptyTrashFailure(requestId, action.error));
    }
}

export default function* watcher() {
    yield takeLeading(emptyTrashIntent.match, emptyTrashWorker);
}
