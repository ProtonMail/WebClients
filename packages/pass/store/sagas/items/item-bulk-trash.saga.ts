import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeLeading } from 'redux-saga/effects';

import { trashItems } from '@proton/pass/lib/items/item.requests';
import {
    itemBulkTrashFailure,
    itemBulkTrashIntent,
    itemBulkTrashProgress,
    itemBulkTrashSuccess,
} from '@proton/pass/store/actions';
import type { RequestProgress } from '@proton/pass/store/actions/with-request';
import { selectItemsFromSelection } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionResponse, SelectedItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type BulkTrashChannel = RequestProgress<ItemRevisionResponse[], SelectedItem[]>;

function* itemBulkTrashWorker(
    _: RootSagaOptions,
    { payload: { itemsByShareId }, meta }: ReturnType<typeof itemBulkTrashIntent>
) {
    const items = (yield select(selectItemsFromSelection(itemsByShareId))) as ItemRevision[];

    const progressChannel = eventChannel<BulkTrashChannel>((emitter) => {
        trashItems(items, (batch, progress) => emitter({ type: 'progress', progress, batch }))
            .then((result) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

    while (true) {
        const action: BulkTrashChannel = yield take(progressChannel);

        switch (action.type) {
            case 'progress':
                yield put(itemBulkTrashProgress(meta.request.id, action.progress, action.batch));
                break;

            case 'done':
                yield put(itemBulkTrashSuccess(meta.request.id, {}));
                break;

            case 'error':
                yield put(itemBulkTrashFailure(meta.request.id, {}, action.error));
                break;
        }
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkTrashIntent.match, itemBulkTrashWorker, options);
}
