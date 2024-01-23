import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import { type MovedItemsBatch, moveItems } from '@proton/pass/lib/items/item.requests';
import {
    itemBulkMoveFailure,
    itemBulkMoveIntent,
    itemBulkMoveProgress,
    itemBulkMoveSuccess,
} from '@proton/pass/store/actions';
import type { RequestProgress } from '@proton/pass/store/actions/with-request';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { selectItemsFromSelection } from '../../selectors';

export type BulkMoveItemsChannel = RequestProgress<ItemRevision[], MovedItemsBatch>;

export const bulkMoveChannel = (items: ItemRevision[], destinationShareId: string) =>
    eventChannel<BulkMoveItemsChannel>((emitter) => {
        moveItems(items, destinationShareId, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

/** FIXME: use event channel */
function* itemBulkMoveWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof itemBulkMoveIntent>
) {
    const requestId = meta.request.id;
    const { itemsByShareId, destinationShareId } = payload;
    const items = (yield select(selectItemsFromSelection(itemsByShareId))) as ItemRevision[];
    const itemsToMove = items.filter(({ shareId }) => shareId !== destinationShareId);
    const channel = bulkMoveChannel(itemsToMove, destinationShareId);

    while (true) {
        const action: BulkMoveItemsChannel = yield take(channel);

        if (action.type === 'progress') {
            yield put(itemBulkMoveProgress(requestId, action.progress, { ...action.data, destinationShareId }));
            onItemsUpdated?.();
        }

        if (action.type === 'done') yield put(itemBulkMoveSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkMoveFailure(requestId, payload, action.error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkMoveIntent.match, itemBulkMoveWorker, options);
}
