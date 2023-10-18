import { put, select, takeEvery } from 'redux-saga/effects';

import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import { createInvite, createNewUserInvite } from '@proton/pass/lib/invites/invite.requests';
import { inviteCreationFailure, inviteCreationIntent, inviteCreationSuccess } from '@proton/pass/store/actions';
import { selectFeatureFlag } from '@proton/pass/store/selectors';
import { type Maybe } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';

/* Depending on the result of the public key for the invited email,
 * adapt the invite creation process */
function* createInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteCreationIntent>) {
    try {
        const allowNewUser: boolean = yield select(selectFeatureFlag(PassFeature.PassSharingNewUsers));
        const invitedPublicKey: Maybe<string> = yield getPrimaryPublicKeyForEmail(payload.email);

        if (!invitedPublicKey && !allowNewUser) throw new Error();

        yield invitedPublicKey ? createInvite({ ...payload, invitedPublicKey }) : createNewUserInvite(payload);
        yield put(inviteCreationSuccess(request.id, payload.shareId));
    } catch (err) {
        yield put(inviteCreationFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteCreationIntent.match, createInviteWorker);
}
