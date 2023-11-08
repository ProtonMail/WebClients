import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteItems } from '@proton/pass/lib/items/item.requests';
import { emptyTrashFailure, emptyTrashIntent, emptyTrashSuccess } from '@proton/pass/store/actions';
import { selectAllTrashedItems } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* emptyTrashWorker({ onItemsChange }: WorkerRootSagaOptions, { meta }: ReturnType<typeof emptyTrashIntent>) {
    try {
        const trashedItems: ItemRevision[] = yield select(selectAllTrashedItems);
        yield deleteItems(trashedItems);
        yield put(emptyTrashSuccess(meta.request.id));
        onItemsChange?.();
    } catch (error: unknown) {
        yield put(emptyTrashFailure(meta.request.id, error));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(emptyTrashIntent.match, emptyTrashWorker, options);
}
