import { put, select, take, takeLeading } from 'redux-saga/effects';

import type { ItemRevision } from '../../../types';
import { restoreTrashFailure, restoreTrashIntent, restoreTrashProgress, restoreTrashSuccess } from '../../actions';
import { selectTrashedItems } from '../../selectors';
import { type BulkRestoreChannel, bulkRestoreChannel } from '../items/item-bulk-restore.saga';

function* restoreTrash({ meta }: ReturnType<typeof restoreTrashIntent>) {
    const requestId = meta.request.id;
    const trashedItems: ItemRevision[] = yield select(selectTrashedItems);
    const progressChannel = bulkRestoreChannel(trashedItems);

    while (true) {
        const action: BulkRestoreChannel = yield take(progressChannel);

        if (action.type === 'progress') yield put(restoreTrashProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(restoreTrashSuccess(requestId));
        if (action.type === 'error') yield put(restoreTrashFailure(requestId, action.error));
    }
}

export default function* watcher() {
    yield takeLeading(restoreTrashIntent.match, restoreTrash);
}
