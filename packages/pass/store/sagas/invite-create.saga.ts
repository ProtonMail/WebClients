import { put, takeEvery } from 'redux-saga/effects';

import { type PendingInvite } from '@proton/pass/types/data/invites';

import { inviteCreationFailure, inviteCreationIntent, inviteCreationSuccess } from '../actions';
import { createInvite, loadInvites } from './workers/invite';

function* createInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteCreationIntent>) {
    try {
        yield createInvite(payload);
        const invites: PendingInvite[] = yield loadInvites(payload.shareId).catch(() => []);

        yield put(inviteCreationSuccess(request.id, payload.shareId, invites));
    } catch (err) {
        yield put(inviteCreationFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteCreationIntent.match, createInviteWorker);
}
