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
    setRequestProgress,
    startEventPolling,
    stopEventPolling,
} from '@proton/pass/store/actions';
import type { RequestProgress } from '@proton/pass/store/actions/with-request';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { Invite, ItemRevision, Maybe, Share, ShareGetResponse, ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

function* acceptInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteAcceptIntent>) {
    try {
        yield put(stopEventPolling());
        const invite: Maybe<Invite> = yield select(selectInviteByToken(payload.inviteToken));
        if (!invite) throw new Error(c('Error').t`Unknown invite`);

        const encryptedShare: ShareGetResponse = yield acceptInvite({ ...payload, inviteKeys: invite.keys });
        const share: Maybe<Share<ShareType.Vault>> = yield parseShareResponse(encryptedShare);
        if (!share) throw new Error(c('Error').t`Could not open invited vault`);

        const progressChannel = eventChannel<RequestProgress<ItemRevision[]>>((emitter) => {
            requestItemsForShareId(share.shareId, (value) => emitter({ type: 'progress', value }))
                .then((result) => emitter({ type: 'done', result }))
                .catch((error) => emitter({ type: 'error', error }))
                .finally(() => emitter(END));

            return noop;
        });

        while (true) {
            const action: RequestProgress<ItemRevision[]> = yield take(progressChannel);
            switch (action.type) {
                case 'progress':
                    if (invite.vault.itemCount === 0) break;
                    yield put(setRequestProgress(request.id, action.value));
                    break;
                case 'done':
                    yield put(inviteAcceptSuccess(request.id, payload.inviteToken, share, action.result));
                    break;
                case 'error':
                    throw action.error;
            }
        }
    } catch (err) {
        yield put(inviteAcceptFailure(request.id, err));
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher() {
    yield takeEvery(inviteAcceptIntent.match, acceptInviteWorker);
}
