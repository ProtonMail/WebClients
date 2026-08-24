import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import noop from '@proton/utils/noop';

import { trashItems } from '../../../lib/items/item.requests';
import type { BatchItemRevisionIDs, ItemRevision, ItemRevisionResponse } from '../../../types';
import { itemBulkTrashFailure, itemBulkTrashIntent, itemBulkTrashProgress, itemBulkTrashSuccess } from '../../actions';
import type { RequestProgress } from '../../request/types';
import { selectBulkSelection } from '../../selectors';

type BulkTrashChannel = RequestProgress<ItemRevisionResponse[], BatchItemRevisionIDs>;

function* itemBulkTrashWorker({ payload: { selected }, meta }: ReturnType<typeof itemBulkTrashIntent>) {
    const items = (yield select(selectBulkSelection(selected))) as ItemRevision[];

    const progressChannel = eventChannel<BulkTrashChannel>((emitter) => {
        trashItems(items, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

    while (true) {
        const action: BulkTrashChannel = yield take(progressChannel);
        if (action.type === 'progress') yield put(itemBulkTrashProgress(meta.request.id, action.progress, action.data));
        if (action.type === 'done') yield put(itemBulkTrashSuccess(meta.request.id, {}));
        if (action.type === 'error') yield put(itemBulkTrashFailure(meta.request.id, {}, action.error));
    }
}

export default function* watcher() {
    yield takeLeading(itemBulkTrashIntent.match, itemBulkTrashWorker);
}
