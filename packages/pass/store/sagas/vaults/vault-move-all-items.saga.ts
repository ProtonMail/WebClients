import { put } from 'redux-saga/effects';

import { moveItems } from '@proton/pass/lib/items/item.requests';
import {
    vaultMoveAllItemsFailure,
    vaultMoveAllItemsIntent,
    vaultMoveAllItemsSuccess,
} from '@proton/pass/store/actions';
import { takeEveryBefore } from '@proton/pass/store/sagas/utils/take.before';
import { selectItemsByShareId } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* moveAllItemsWorker(
    { payload: { shareId, vaultName, destinationShareId }, meta }: ReturnType<typeof vaultMoveAllItemsIntent>,
    stateBeforeAction: State,
    { onItemsChange }: WorkerRootSagaOptions
): Generator {
    try {
        const items = selectItemsByShareId(stateBeforeAction, shareId);

        const movedItems = (yield moveItems(items, destinationShareId)) as ItemRevision[];

        yield put(vaultMoveAllItemsSuccess(meta.request.id, { shareId, vaultName, movedItems }));
        onItemsChange?.();
    } catch (e) {
        yield put(vaultMoveAllItemsFailure(meta.request.id, { shareId, vaultName }, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEveryBefore(vaultMoveAllItemsIntent.match, moveAllItemsWorker, options);
}
