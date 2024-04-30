import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import { deleteItems } from '@proton/pass/lib/items/item.requests';
import {
    itemBulkDeleteFailure,
    itemBulkDeleteIntent,
    itemBulkDeleteProgress,
    itemBulkDeleteSuccess,
} from '@proton/pass/store/actions';
import type { RequestProgress } from '@proton/pass/store/request/types';
import { selectBulkSelection } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { BatchItemRevisionIDs, ItemRevision } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type BulkDeleteChannel = RequestProgress<BatchItemRevisionIDs>;

export const bulkDeleteChannel = (items: ItemRevision[]) =>
    eventChannel<BulkDeleteChannel>((emitter) => {
        deleteItems(items, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result: any) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

function* itemBulkDeleteWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof itemBulkDeleteIntent>
) {
    const requestId = meta.request.id;
    const { selected } = payload;
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];
    const progressChannel = bulkDeleteChannel(items);

    while (true) {
        const action: BulkDeleteChannel = yield take(progressChannel);
        onItemsUpdated?.();

        if (action.type === 'progress') yield put(itemBulkDeleteProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkDeleteSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkDeleteFailure(requestId, {}, action.error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkDeleteIntent.match, itemBulkDeleteWorker, options);
}
