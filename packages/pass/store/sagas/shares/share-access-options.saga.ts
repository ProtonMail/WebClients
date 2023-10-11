import { put, select, takeEvery } from 'redux-saga/effects';

import { loadInvites } from '@proton/pass/lib/invites/invite.requests';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import { loadShareMembers } from '@proton/pass/lib/shares/share.requests';
import {
    getShareAccessOptionsFailure,
    getShareAccessOptionsIntent,
    getShareAccessOptionsSuccess,
} from '@proton/pass/store/actions';
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { ShareAccessOptions } from '@proton/pass/types/data/shares.dto';

/**
 * Only the owner or the manager of a share can manage the invites.
 * Only request the members if the share is actually shared.
 */
function* shareAccessOptionsWorker({ payload, meta: { request } }: ReturnType<typeof getShareAccessOptionsIntent>) {
    try {
        const { shareId } = payload;
        const share: ShareItem = yield select(selectShareOrThrow(shareId));

        const accessOptions: ShareAccessOptions = {
            shareId,
            invites: isShareManageable(share) ? yield loadInvites(shareId) : undefined,
            members: share.shared ? yield loadShareMembers(shareId) : [],
        };

        yield put(getShareAccessOptionsSuccess(request.id, accessOptions));
    } catch (err) {
        yield put(getShareAccessOptionsFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(getShareAccessOptionsIntent.match, shareAccessOptionsWorker);
}
