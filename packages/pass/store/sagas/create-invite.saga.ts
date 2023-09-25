import { put, takeEvery } from 'redux-saga/effects';

import { type PendingInvite } from '@proton/pass/types/data/invites';

import { vaultInviteCreationFailure, vaultInviteCreationIntent, vaultInviteCreationSuccess } from '../actions';
import { createVaultInvite, loadPendingShareInvites } from './workers/invite';

function* createInviteWorker({ payload, meta: { request } }: ReturnType<typeof vaultInviteCreationIntent>) {
    try {
        yield createVaultInvite(payload);
        const invites: PendingInvite[] = yield loadPendingShareInvites(payload.shareId).catch(() => []);

        yield put(vaultInviteCreationSuccess(request.id, payload.shareId, invites));
    } catch (err) {
        yield put(vaultInviteCreationFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(vaultInviteCreationIntent.match, createInviteWorker);
}
