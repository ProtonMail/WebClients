import { put, select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { acceptGroupInvite } from '@proton/pass/lib/invites/invite.requests';
import { groupInviteAccept, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import { type Invite, InviteType, type Maybe } from '@proton/pass/types';

function* acceptGroupInviteWorker({ payload, meta: { request } }: ReturnType<typeof groupInviteAccept.intent>) {
    const requestId = request.id;
    const { inviteToken } = payload;

    try {
        yield put(stopEventPolling());

        const invite: Maybe<Invite> = yield select(selectInviteByToken(inviteToken));
        if (!invite) throw new Error(c('Error').t`Unknown invite`);

        yield acceptGroupInvite(payload, invite.invitedGroupId!, invite.keys, invite.type === InviteType.GroupOrg);
        yield put(groupInviteAccept.success(requestId, { inviteToken }));
    } catch (err) {
        yield put(groupInviteAccept.failure(requestId, err));
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher() {
    yield takeEvery(groupInviteAccept.intent.match, acceptGroupInviteWorker);
}
