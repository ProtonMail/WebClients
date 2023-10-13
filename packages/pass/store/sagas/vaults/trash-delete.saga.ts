import { put } from 'redux-saga/effects';

import { deleteItems } from '@proton/pass/lib/items/item.requests';
import { emptyTrashFailure, emptyTrashIntent, emptyTrashSuccess } from '@proton/pass/store/actions';
import { takeBefore } from '@proton/pass/store/sagas/utils/take.before';
import { selectAllTrashedItems } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';

function* deleteTrash(
    _: ReturnType<typeof emptyTrashIntent>,
    stateBeforeAction: State,
    { onItemsChange }: WorkerRootSagaOptions
) {
    try {
        yield deleteItems(selectAllTrashedItems(stateBeforeAction));
        yield put(emptyTrashSuccess());
        onItemsChange?.();
    } catch (e) {
        yield put(emptyTrashFailure(e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeBefore(emptyTrashIntent.match, deleteTrash, options);
}
