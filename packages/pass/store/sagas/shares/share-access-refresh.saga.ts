import { call, put, takeEvery } from 'redux-saga/effects';

import { shareFetcher } from '@proton/pass/lib/sync/v2/user-events.shares';
import { shareUpdated } from '@proton/pass/store/actions';
import { refreshShareAccess } from '@proton/pass/store/actions/creators/polling';
import type { MaybeNull, Share } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

function* refreshShareAccessWorker({ payload: shareId }: ReturnType<typeof refreshShareAccess>) {
    try {
        const share: MaybeNull<Share> = yield call(shareFetcher, shareId);
        if (share) yield put(shareUpdated(share));
    } catch (err) {
        logger.warn(`[ShareAccess] Failed refreshing share ${logId(shareId)}`, err);
    }
}

export default function* watcher() {
    yield takeEvery(refreshShareAccess.match, refreshShareAccessWorker);
}
