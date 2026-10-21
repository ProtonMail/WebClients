import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import noop from '@proton/utils/noop';

import { restoreItems } from '../../../lib/items/item.requests';
import type { ItemRevisionResponse } from '../../../types/api/pass';
import type { BatchItemRevisionIDs, ItemRevision } from '../../../types/data/items';
import {
    itemBulkRestoreFailure,
    itemBulkRestoreIntent,
    itemBulkRestoreProgress,
    itemBulkRestoreSuccess,
} from '../../actions/creators/item';
import type { RequestProgress } from '../../request/types';
import { selectBulkSelection } from '../../selectors/bulk';

export type BulkRestoreChannel = RequestProgress<ItemRevisionResponse[], BatchItemRevisionIDs>;

export const bulkRestoreChannel = (items: ItemRevision[]) =>
    eventChannel<BulkRestoreChannel>((emitter) => {
        restoreItems(items, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result: any) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

function* itemBulkDeleteWorker({ payload, meta }: ReturnType<typeof itemBulkRestoreIntent>) {
    const requestId = meta.request.id;
    const { selected } = payload;
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];
    const progressChannel = bulkRestoreChannel(items);

    while (true) {
        const action: BulkRestoreChannel = yield take(progressChannel);
        if (action.type === 'progress') yield put(itemBulkRestoreProgress(requestId, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkRestoreSuccess(requestId, {}));
        if (action.type === 'error') yield put(itemBulkRestoreFailure(requestId, {}, action.error));
    }
}

export default function* watcher() {
    yield takeLeading(itemBulkRestoreIntent.match, itemBulkDeleteWorker);
}
