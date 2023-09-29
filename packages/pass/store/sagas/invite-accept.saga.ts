import { put, select, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import type { Invite, ItemRevision, Maybe, Share, ShareGetResponse, ShareType } from '@proton/pass/types';

import {
    inviteAcceptFailure,
    inviteAcceptIntent,
    inviteAcceptSuccess,
    startEventPolling,
    stopEventPolling,
} from '../actions';
import { selectInviteByToken } from '../selectors/invites';
import { acceptInvite } from './workers/invite';
import { requestItemsForShareId } from './workers/items';
import { decryptShareResponse } from './workers/shares';

function* acceptInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteAcceptIntent>) {
    try {
        yield put(stopEventPolling());
        const invite: Maybe<Invite> = yield select(selectInviteByToken(payload.inviteToken));
        if (!invite) throw new Error(c('Error').t`Unknown invite`);

        const encryptedShare: ShareGetResponse = yield acceptInvite({ ...payload, inviteKeys: invite.keys });
        const share: Maybe<Share<ShareType.Vault>> = yield decryptShareResponse(encryptedShare);
        if (!share) throw new Error(c('Error').t`Could not open invited vault`);

        const items: ItemRevision[] = yield requestItemsForShareId(share.shareId);

        // FIXME: get member data as well
        yield put(inviteAcceptSuccess(request.id, payload.inviteToken, share, items));
    } catch (err) {
        yield put(inviteAcceptFailure(request.id, err));
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher() {
    yield takeEvery(inviteAcceptIntent.match, acceptInviteWorker);
}
