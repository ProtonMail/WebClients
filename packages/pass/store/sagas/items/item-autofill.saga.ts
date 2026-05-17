import { call, put, takeEvery } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { updateItemLastUseTime } from '@proton/pass/lib/items/item.requests';
import { itemAutofilled, itemsUpdated } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { logId, logger } from '@proton/pass/utils/logger';

function* itemAutofilledWorker({ onItemsUpdated }: RootSagaOptions, { payload: { shareId, itemId } }: ReturnType<typeof itemAutofilled>) {
    try {
        logger.info(`[Item::Autofill] used item ${logId(itemId)} on share ${logId(shareId)}`);
        yield call(onItemsUpdated, { report: false }); /** force `onItemsUpdated` to re-order items in autofill suggestions */

        const encryptedItem: ItemRevisionContentsResponse = yield updateItemLastUseTime(shareId, itemId);
        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);
        yield put(itemsUpdated([item]));
    } catch (err: unknown) {
        logger.warn(`[Item::Autofill] lastUseTime update failed for item ${logId(itemId)} on share ${logId(shareId)}`, err);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemAutofilled.match, itemAutofilledWorker, options);
}
