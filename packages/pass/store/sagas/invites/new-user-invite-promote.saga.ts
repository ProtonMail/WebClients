import { put, select, takeEvery } from 'redux-saga/effects';

import type { AccessItem } from '../../../lib/access/types';
import { getPrimaryPublicKeyForEmail } from '../../../lib/auth/address';
import type { InviteData } from '../../../lib/invites/invite.requests';
import { loadInvites, promoteInvite } from '../../../lib/invites/invite.requests';
import type { Maybe } from '../../../types';
import { newUserInvitePromoteFailure, newUserInvitePromoteIntent, newUserInvitePromoteSuccess } from '../../actions';
import { syncAccess } from '../../actions/creators/polling';
import { selectAccessOrThrow } from '../../selectors';

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
        yield put(syncAccess(payload));
    } catch (err) {
        yield put(newUserInvitePromoteFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(newUserInvitePromoteIntent.match, promoteInviteWorker);
}
