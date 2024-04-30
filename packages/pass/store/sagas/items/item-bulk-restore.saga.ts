import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import { restoreItems } from '@proton/pass/lib/items/item.requests';
import {
    itemBulkRestoreFailure,
    itemBulkRestoreIntent,
    itemBulkRestoreProgress,
    itemBulkRestoreSuccess,
} from '@proton/pass/store/actions';
import type { RequestProgress } from '@proton/pass/store/request/types';
import { selectBulkSelection } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { BatchItemRevisionIDs, ItemRevision, ItemRevisionResponse } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type BulkRestoreChannel = RequestProgress<ItemRevisionResponse[], BatchItemRevisionIDs>;

export const bulkRestoreChannel = (items: ItemRevision[]) =>
    eventChannel<BulkRestoreChannel>((emitter) => {
        restoreItems(items, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result: any) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

function* itemBulkDeleteWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta }: ReturnType<typeof itemBulkRestoreIntent>
) {
    const requestId = meta.request.id;
    const { selected } = payload;
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];
    const progressChannel = bulkRestoreChannel(items);

    while (true) {
        const action: BulkRestoreChannel = yield take(progressChannel);
        onItemsUpdated?.();

        if (action.type === 'progress') yield put(itemBulkRestoreProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkRestoreSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkRestoreFailure(requestId, {}, action.error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkRestoreIntent.match, itemBulkDeleteWorker, options);
}
