import { put, select, take, takeLeading } from 'redux-saga/effects';

import type { ItemRevision } from '../../../types';
import { emptyTrashFailure, emptyTrashIntent, emptyTrashProgress, emptyTrashSuccess } from '../../actions';
import { selectTrashedItems } from '../../selectors';
import { type BulkDeleteChannel, bulkDeleteChannel } from '../items/item-bulk-delete.saga';

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
