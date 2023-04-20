import { all, put, takeLatest } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import groupWith from '@proton/utils/groupWith';

import { emptyTrashFailure, emptyTrashIntent, emptyTrashSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* deleteTrash({ onItemsChange }: WorkerRootSagaOptions, { payload }: ReturnType<typeof emptyTrashIntent>) {
    const groupedByShareId = groupWith((a, b) => a.shareId === b.shareId, payload.trashedItems);

    try {
        yield all(
            groupedByShareId.map((items) =>
                api({
                    url: `pass/v1/share/${items[0].shareId}/item`,
                    method: 'delete',
                    data: {
                        Items: items.map(({ itemId, revision }) => ({ ItemID: itemId, Revision: revision })),
                    },
                })
            )
        );

        yield put(emptyTrashSuccess());
        onItemsChange?.();
    } catch (e) {
        yield put(emptyTrashFailure(e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLatest(emptyTrashIntent, deleteTrash, options);
}
