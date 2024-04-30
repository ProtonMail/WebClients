import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import { moveItems } from '@proton/pass/lib/items/item.requests';
import {
    itemBulkMoveFailure,
    itemBulkMoveIntent,
    itemBulkMoveProgress,
    itemBulkMoveSuccess,
} from '@proton/pass/store/actions';
import type { RequestProgress } from '@proton/pass/store/request/types';
import { selectBulkSelection } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { BatchItemRevisions, ItemRevision } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type BulkMoveItemsChannel = RequestProgress<
    ItemRevision[],
    BatchItemRevisions & { movedItems: ItemRevision[]; destinationShareId: string }
>;

export const bulkMoveChannel = (items: ItemRevision[], destinationShareId: string) =>
    eventChannel<BulkMoveItemsChannel>((emitter) => {
        moveItems(items, destinationShareId, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

function* itemBulkMoveWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof itemBulkMoveIntent>
) {
    const requestId = meta.request.id;
    const { selected, shareId } = payload;
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];
    const itemsToMove = items.filter((item) => item.shareId !== shareId);
    const channel = bulkMoveChannel(itemsToMove, shareId);

    while (true) {
        const action: BulkMoveItemsChannel = yield take(channel);
        onItemsUpdated?.();

        if (action.type === 'progress') yield put(itemBulkMoveProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkMoveSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkMoveFailure(requestId, payload, action.error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkMoveIntent.match, itemBulkMoveWorker, options);
}
