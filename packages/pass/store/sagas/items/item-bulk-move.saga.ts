import { put, select, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { MAX_BATCH_ITEMS_PER_REQUEST } from '@proton/pass/constants';
import { moveItems } from '@proton/pass/lib/items/item.requests';
import {
    itemBulkBatchMoveSuccess,
    itemBulkMoveFailure,
    itemBulkMoveIntent,
    itemBulkMoveSuccess,
    notification,
    requestProgress,
} from '@proton/pass/store/actions';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import chunk from '@proton/utils/chunk';

function* itemBulkMoveWorker(
    _: RootSagaOptions,
    { payload: { itemsByShareId, destinationShareId }, meta }: ReturnType<typeof itemBulkMoveIntent>
) {
    /* we want to apply these request sequentially to avoid
     * swarming the network with too many parallel requests */
    let totalItems: number = 0;
    const state = (yield select()) as State;

    for (const shareId in itemsByShareId) {
        if (shareId === destinationShareId || !itemsByShareId[shareId].length) continue;

        try {
            const items = itemsByShareId[shareId].map((itemId) => state.items.byShareId[shareId][itemId]);

            for (const batch of chunk(items, MAX_BATCH_ITEMS_PER_REQUEST)) {
                try {
                    const movedItems = (yield moveItems(batch, destinationShareId)) as ItemRevision[];
                    totalItems += movedItems.length;
                    yield put(requestProgress(meta.request.id, totalItems));
                    yield put(
                        itemBulkBatchMoveSuccess({
                            destinationShareId,
                            itemIds: batch.map(prop('itemId')),
                            movedItems,
                            shareId,
                        })
                    );
                } catch (e) {
                    const description = e instanceof Error ? getApiErrorMessage(e) ?? e?.message : '';
                    yield put(
                        notification({
                            key: meta.request.id,
                            type: 'error',
                            text: c('Error').t`Moven bulk failed for batch : ${description}`,
                        })
                    );
                }
            }
            yield put(itemBulkMoveSuccess(meta.request.id, { itemsByShareId, destinationShareId }));
        } catch (e) {
            yield put(itemBulkMoveFailure(meta.request.id, { itemsByShareId, destinationShareId }, e));
        }
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkMoveIntent.match, itemBulkMoveWorker, options);
}
