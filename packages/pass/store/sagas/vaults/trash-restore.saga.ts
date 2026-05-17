import { put, select, take, takeLeading } from 'redux-saga/effects';

import { restoreTrashFailure, restoreTrashIntent, restoreTrashProgress, restoreTrashSuccess } from '@proton/pass/store/actions';
import { type BulkRestoreChannel, bulkRestoreChannel } from '@proton/pass/store/sagas/items/item-bulk-restore.saga';
import { selectTrashedItems } from '@proton/pass/store/selectors';
import type { ItemRevision } from '@proton/pass/types';

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
