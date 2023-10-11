import { put } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { moveItems } from '@proton/pass/lib/items/item.requests';
import { vaultDeleteFailure, vaultDeleteIntent, vaultDeleteSuccess } from '@proton/pass/store/actions';
import { takeEveryBefore } from '@proton/pass/store/sagas/utils/take.before';
import { selectItemsByShareId } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* deleteVault(
    { payload: { id, content, destinationShareId } }: ReturnType<typeof vaultDeleteIntent>,
    stateBeforeAction: State,
    { onItemsChange }: WorkerRootSagaOptions
): Generator {
    try {
        const items = selectItemsByShareId(stateBeforeAction, id);

        const movedItems = (yield destinationShareId !== null
            ? moveItems(items, destinationShareId)
            : []) as ItemRevision[];

        yield api({ url: `pass/v1/vault/${id}`, method: 'delete' });

        PassCrypto.removeShare(id);

        yield put(vaultDeleteSuccess({ id, content, movedItems }));
        onItemsChange?.();
    } catch (e) {
        yield put(vaultDeleteFailure({ id, content }, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEveryBefore(vaultDeleteIntent.match, deleteVault, options);
}
