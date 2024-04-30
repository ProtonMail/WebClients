import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { acceptInvite } from '@proton/pass/lib/invites/invite.requests';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import {
    inviteAcceptFailure,
    inviteAcceptIntent,
    inviteAcceptSuccess,
    startEventPolling,
    stopEventPolling,
} from '@proton/pass/store/actions';
import { requestProgress } from '@proton/pass/store/request/actions';
import type { RequestProgress } from '@proton/pass/store/request/types';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { Invite, ItemRevision, Maybe, Share, ShareGetResponse, ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type AcceptInviteChannel = RequestProgress<ItemRevision[], null>;

function* acceptInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteAcceptIntent>) {
    const requestId = request.id;
    const { inviteToken } = payload;

    try {
        yield put(stopEventPolling());

        const invite: Maybe<Invite> = yield select(selectInviteByToken(inviteToken));
        if (!invite) throw new Error(c('Error').t`Unknown invite`);

        const encryptedShare: ShareGetResponse = yield acceptInvite({ ...payload, inviteKeys: invite.keys });
        const share: Maybe<Share<ShareType.Vault>> = yield parseShareResponse(encryptedShare);
        if (!share) throw new Error(c('Error').t`Could not open invited vault`);

        const progressChannel = eventChannel<AcceptInviteChannel>((emitter) => {
            requestItemsForShareId(share.shareId, (progress) => emitter({ type: 'progress', progress, data: null }))
                .then((result) => emitter({ type: 'done', result }))
                .catch((error) => emitter({ type: 'error', error }))
                .finally(() => emitter(END));

            return noop;
        });

        while (true) {
            const action: AcceptInviteChannel = yield take(progressChannel);
            if (action.type === 'progress') yield put(requestProgress(requestId, action.progress));
            if (action.type === 'done') yield put(inviteAcceptSuccess(requestId, inviteToken, share, action.result));
            if (action.type === 'error') throw action.error;
        }
    } catch (err) {
        yield put(inviteAcceptFailure(requestId, err));
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher() {
    yield takeEvery(inviteAcceptIntent.match, acceptInviteWorker);
}
