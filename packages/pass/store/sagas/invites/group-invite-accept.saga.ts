import { put, select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { acceptGroupInvite } from '../../../lib/invites/invite.requests';
import { type Invite, InviteType } from '../../../types/data/invites';
import type { Maybe } from '../../../types/utils';
import { startEventPolling, stopEventPolling } from '../../actions/creators/client';
import { groupInviteAccept } from '../../actions/creators/invite';
import { selectInviteByToken } from '../../selectors/invites';

function* acceptGroupInviteWorker({ payload, meta: { request } }: ReturnType<typeof groupInviteAccept.intent>) {
    const requestId = request.id;
    const { inviteToken } = payload;

    try {
        yield put(stopEventPolling());

        const invite: Maybe<Invite> = yield select(selectInviteByToken(inviteToken));
        if (!invite) throw new Error(c('Error').t`This invite is no longer available`);

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
