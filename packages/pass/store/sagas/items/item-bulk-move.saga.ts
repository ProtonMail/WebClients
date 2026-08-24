import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import noop from '@proton/utils/noop';

import { moveItems } from '../../../lib/items/item.requests';
import type { BatchItemRevisions, ItemRevision } from '../../../types';
import { itemBulkMoveFailure, itemBulkMoveIntent, itemBulkMoveProgress, itemBulkMoveSuccess } from '../../actions';
import type { RequestProgress } from '../../request/types';
import { selectBulkSelection } from '../../selectors';

export type BulkMoveItemsChannel = RequestProgress<
    ItemRevision[],
    BatchItemRevisions & { movedItems: ItemRevision[]; targetShareId: string }
>;

export const bulkMoveChannel = (items: ItemRevision[], targetShareId: string) =>
    eventChannel<BulkMoveItemsChannel>((emitter) => {
        moveItems(items, targetShareId, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

function* itemBulkMoveWorker({ payload, meta }: ReturnType<typeof itemBulkMoveIntent>) {
    const requestId = meta.request.id;
    const { selected, shareId } = payload;
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];
    const itemsToMove = items.filter((item) => item.shareId !== shareId);
    const channel = bulkMoveChannel(itemsToMove, shareId);

    while (true) {
        const action: BulkMoveItemsChannel = yield take(channel);
        if (action.type === 'progress') yield put(itemBulkMoveProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkMoveSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkMoveFailure(requestId, payload, action.error));
    }
}

export default function* watcher() {
    yield takeLeading(itemBulkMoveIntent.match, itemBulkMoveWorker);
}
