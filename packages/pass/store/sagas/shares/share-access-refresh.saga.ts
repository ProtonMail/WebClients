import { call, put, takeEvery } from 'redux-saga/effects';

import { shareFetcher } from '../../../lib/sync/v2/user-events.shares';
import type { Share } from '../../../types/data/shares';
import type { MaybeNull } from '../../../types/utils';
import { logId, logger } from '../../../utils/logger';
import { refreshShareAccess } from '../../actions/creators/polling';
import { shareUpdated } from '../../actions/creators/share';

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
