import { put } from 'redux-saga/effects';

import { restoreItems } from '@proton/pass/lib/items/item.requests';
import { restoreTrashFailure, restoreTrashIntent, restoreTrashSuccess } from '@proton/pass/store/actions';
import { takeBefore } from '@proton/pass/store/sagas/utils/take.before';
import { selectAllTrashedItems } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';

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
