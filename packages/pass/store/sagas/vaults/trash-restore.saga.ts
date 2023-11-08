import { put, select, takeLeading } from 'redux-saga/effects';

import { restoreItems } from '@proton/pass/lib/items/item.requests';
import { restoreTrashFailure, restoreTrashIntent, restoreTrashSuccess } from '@proton/pass/store/actions';
import { selectAllTrashedItems } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* restoreTrash({ onItemsChange }: WorkerRootSagaOptions, { meta }: ReturnType<typeof restoreTrashIntent>) {
    try {
        const trashedItems: ItemRevision[] = yield select(selectAllTrashedItems);
        yield restoreItems(trashedItems);
        yield put(restoreTrashSuccess(meta.request.id));

        onItemsChange?.();
    } catch (e) {
        yield put(restoreTrashFailure(meta.request.id, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(restoreTrashIntent.match, restoreTrash, options);
}
