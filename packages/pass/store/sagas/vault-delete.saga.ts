import { put } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { PassCrypto } from '@proton/pass/crypto';
import type { ItemRevision } from '@proton/pass/types';

import { acknowledgeRequest, vaultDeleteFailure, vaultDeleteIntent, vaultDeleteSuccess } from '../actions';
import { selectItemsByShareId } from '../selectors';
import type { State, WorkerRootSagaOptions } from '../types';
import { takeEveryBefore } from './utils/take.before';
import { moveItems } from './workers/items';

function* deleteVault(
    { payload: { id, content, destinationShareId }, meta }: ReturnType<typeof vaultDeleteIntent>,
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
    } finally {
        yield put(acknowledgeRequest(meta.request.id));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEveryBefore(vaultDeleteIntent.match, deleteVault, options);
}
