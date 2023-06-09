import { put } from 'redux-saga/effects';

import { restoreTrashFailure, restoreTrashIntent, restoreTrashSuccess } from '../actions';
import { selectAllTrashedItems } from '../selectors';
import type { State, WorkerRootSagaOptions } from '../types';
import { takeBefore } from './utils/take.before';
import { restoreItems } from './workers/items';

function* restoreTrash(
    { meta }: ReturnType<typeof restoreTrashIntent>,
    stateBeforeAction: State,
    { onItemsChange }: WorkerRootSagaOptions
) {
    const { callback: onRestoreTrashProcessed } = meta;

    try {
        yield restoreItems(selectAllTrashedItems(stateBeforeAction));
        const restoreTrashSuccessAction = restoreTrashSuccess();
        yield put(restoreTrashSuccessAction);

        onRestoreTrashProcessed?.(restoreTrashSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const restoreTrashFailureAction = restoreTrashFailure(e);
        yield put(restoreTrashFailureAction);

        onRestoreTrashProcessed?.(restoreTrashFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeBefore(restoreTrashIntent.match, restoreTrash, options);
}
