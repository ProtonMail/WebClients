import { put, takeEvery } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { updateItemLastUseTime } from '@proton/pass/lib/items/item.requests';
import { itemAutofilled, itemEditSync } from '@proton/pass/store/actions';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

function* itemAutofilledWorker({ payload: { shareId, itemId } }: ReturnType<typeof itemAutofilled>) {
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
    yield takeEvery(itemAutofilled.match, itemAutofilledWorker);
}
