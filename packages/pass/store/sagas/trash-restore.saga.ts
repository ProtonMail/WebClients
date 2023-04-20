import { all, put, takeLatest } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import groupWith from '@proton/utils/groupWith';

import { restoreTrashFailure, restoreTrashIntent, restoreTrashSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* restoreTrash(
    { onItemsChange }: WorkerRootSagaOptions,
    { meta, payload }: ReturnType<typeof restoreTrashIntent>
) {
    const { callback: onRestoreTrashProcessed } = meta;
    const groupedByShareId = groupWith((a, b) => a.shareId === b.shareId, payload.trashedItems);

    try {
        yield all(
            groupedByShareId.map((items) =>
                api({
                    url: `pass/v1/share/${items[0].shareId}/item/untrash`,
                    method: 'post',
                    data: {
                        Items: items.map(({ itemId, revision }) => ({ ItemID: itemId, Revision: revision })),
                    },
                })
            )
        );

        const restoreTrashSuccessAction = restoreTrashSuccess();
        yield put(restoreTrashSuccessAction);

        onRestoreTrashProcessed?.(restoreTrashSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const restoreTrashFailureAction = restoreTrashFailure(e);
        yield put(restoreTrashFailureAction);

        onRestoreTrashProcessed?.(restoreTrashFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLatest(restoreTrashIntent, restoreTrash, options);
}
