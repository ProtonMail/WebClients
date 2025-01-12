import { put, select, takeEvery } from 'redux-saga/effects';

import type { AccessItem } from '@proton/pass/lib/access/types';
import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import { loadInvites, promoteInvite } from '@proton/pass/lib/invites/invite.requests';
import {
    newUserInvitePromoteFailure,
    newUserInvitePromoteIntent,
    newUserInvitePromoteSuccess,
} from '@proton/pass/store/actions';
import { selectAccessOrThrow } from '@proton/pass/store/selectors';
import type { Maybe } from '@proton/pass/types';

function* promoteInviteWorker({ payload, meta: { request } }: ReturnType<typeof newUserInvitePromoteIntent>) {
    try {
        const { newUserInviteId, shareId } = payload;
        const access: AccessItem = yield select(selectAccessOrThrow(shareId));

        const newUserInvite = access.newUserInvites.find((invite) => newUserInviteId === invite.newUserInviteId);
        if (!newUserInvite) throw new Error();

        const invitedPublicKey: Maybe<string> = yield getPrimaryPublicKeyForEmail(newUserInvite.invitedEmail);
        if (!invitedPublicKey) throw new Error();

        yield promoteInvite({ ...payload, invitedPublicKey });
        const invites: InviteData = yield loadInvites(shareId);
        yield put(newUserInvitePromoteSuccess(request.id, { ...payload, ...invites }));
    } catch (err) {
        yield put(newUserInvitePromoteFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(newUserInvitePromoteIntent.match, promoteInviteWorker);
}
