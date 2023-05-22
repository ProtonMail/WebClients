import { put } from 'redux-saga/effects';

import { emptyTrashFailure, emptyTrashIntent, emptyTrashSuccess } from '../actions';
import { selectAllTrashedItems } from '../selectors';
import type { State, WorkerRootSagaOptions } from '../types';
import { takeBefore } from './utils/take.before';
import { deleteItems } from './workers/items';

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
