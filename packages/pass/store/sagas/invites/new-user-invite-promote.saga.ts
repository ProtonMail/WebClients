import { put, select, takeEvery } from 'redux-saga/effects';

import { getPrimaryPublicKeyForEmail } from '@proton/pass/lib/auth/address';
import type { InviteData } from '@proton/pass/lib/invites/invite.requests';
import { loadInvites, promoteInvite } from '@proton/pass/lib/invites/invite.requests';
import {
    newUserInvitePromoteFailure,
    newUserInvitePromoteIntent,
    newUserInvitePromoteSuccess,
} from '@proton/pass/store/actions';
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ShareType } from '@proton/pass/types';
import { type Maybe } from '@proton/pass/types';

function* promoteInviteWorker({ payload, meta: { request } }: ReturnType<typeof newUserInvitePromoteIntent>) {
    try {
        const { newUserInviteId, shareId } = payload;
        const share: ShareItem<ShareType.Vault> = yield select(selectShareOrThrow(shareId));

        const newUserInvite = (share.newUserInvites ?? []).find((invite) => newUserInviteId === invite.newUserInviteId);
        if (!newUserInvite) throw new Error();

        const invitedPublicKey: Maybe<string> = yield getPrimaryPublicKeyForEmail(newUserInvite.invitedEmail);
        if (!invitedPublicKey) throw new Error();

        yield promoteInvite({ invitedPublicKey, newUserInviteId, shareId });
        const invites: InviteData = yield loadInvites(shareId);
        yield put(newUserInvitePromoteSuccess(request.id, shareId, invites));
    } catch (err) {
        yield put(newUserInvitePromoteFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(newUserInvitePromoteIntent.match, promoteInviteWorker);
}
