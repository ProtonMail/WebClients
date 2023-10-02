import { put, select, takeEvery } from 'redux-saga/effects';

import type { ShareAccessOptions } from '@proton/pass/types/data/shares.dto';
import { isShareManageable } from '@proton/pass/utils/pass/share';

import { getShareAccessOptionsFailure, getShareAccessOptionsIntent, getShareAccessOptionsSuccess } from '../actions';
import type { ShareItem } from '../reducers';
import { selectShareOrThrow } from '../selectors';
import { loadInvites } from './workers/invite';
import { loadShareMembers } from './workers/shares';

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
