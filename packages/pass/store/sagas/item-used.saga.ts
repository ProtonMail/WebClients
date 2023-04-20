import { put, takeEvery } from 'redux-saga/effects';

import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

import { itemEditSync, itemUsed } from '../actions';
import { parseItemRevision, updateItemLastUseTime } from './workers/items';

function* itemUsedWorker({ payload: { shareId, itemId } }: ReturnType<typeof itemUsed>) {
    try {
        logger.info(`[Saga::Item] used item ${logId(itemId)} on share ${logId(shareId)}`);
        const encryptedItem: ItemRevisionContentsResponse = yield updateItemLastUseTime(shareId, itemId);
        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);
        yield put(itemEditSync({ shareId, itemId, item }));
    } catch (e) {
        logger.warn(`[Saga::Item] lastUseTime update failed for item ${logId(itemId)} on share ${logId(shareId)}`, e);
    }
}

export default function* watcher() {
    yield takeEvery(itemUsed.match, itemUsedWorker);
}
