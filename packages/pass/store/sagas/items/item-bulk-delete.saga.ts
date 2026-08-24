import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import noop from '@proton/utils/noop';

import { deleteItems } from '../../../lib/items/item.requests';
import type { BatchItemRevisionIDs, ItemRevision } from '../../../types';
import { itemBulkDeleteFailure, itemBulkDeleteIntent, itemBulkDeleteProgress, itemBulkDeleteSuccess } from '../../actions';
import type { RequestProgress } from '../../request/types';
import { selectBulkSelection } from '../../selectors';

export type BulkDeleteChannel = RequestProgress<BatchItemRevisionIDs>;

export const bulkDeleteChannel = (items: ItemRevision[]) =>
    eventChannel<BulkDeleteChannel>((emitter) => {
        deleteItems(items, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result: any) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

function* itemBulkDeleteWorker({ payload, meta }: ReturnType<typeof itemBulkDeleteIntent>) {
    const requestId = meta.request.id;
    const { selected } = payload;
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];
    const progressChannel = bulkDeleteChannel(items);

    while (true) {
        const action: BulkDeleteChannel = yield take(progressChannel);
        if (action.type === 'progress') yield put(itemBulkDeleteProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkDeleteSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkDeleteFailure(requestId, {}, action.error));
    }
}

export default function* watcher() {
    yield takeLeading(itemBulkDeleteIntent.match, itemBulkDeleteWorker);
}
