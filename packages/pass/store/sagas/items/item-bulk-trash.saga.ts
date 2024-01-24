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
import { selectItemsFromBulkSelectionDTO } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionResponse, SelectedItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

type BulkTrashChannel = RequestProgress<ItemRevisionResponse[], SelectedItem[]>;

function* itemBulkTrashWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload: { selected }, meta }: ReturnType<typeof itemBulkTrashIntent>
) {
    const items = (yield select(selectItemsFromBulkSelectionDTO(selected))) as ItemRevision[];

    const progressChannel = eventChannel<BulkTrashChannel>((emitter) => {
        trashItems(items, (data, progress) => emitter({ type: 'progress', progress, data }))
            .then((result) => emitter({ type: 'done', result }))
            .catch((error) => emitter({ type: 'error', error }))
            .finally(() => emitter(END));

        return noop;
    });

    while (true) {
        const action: BulkTrashChannel = yield take(progressChannel);

        if (action.type === 'progress') {
            yield put(itemBulkTrashProgress(meta.request.id, action.progress, action.data));
            onItemsUpdated?.();
        }

        if (action.type === 'done') yield put(itemBulkTrashSuccess(meta.request.id, {}));
        if (action.type === 'error') yield put(itemBulkTrashFailure(meta.request.id, {}, action.error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(itemBulkTrashIntent.match, itemBulkTrashWorker, options);
}
