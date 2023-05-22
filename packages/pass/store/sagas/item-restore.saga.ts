import { put, takeLatest } from 'redux-saga/effects';

import { api } from '@proton/pass/api';

import { itemRestoreFailure, itemRestoreIntent, itemRestoreSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* restoreItem(
    { onItemsChange }: WorkerRootSagaOptions,
    { payload, meta }: ReturnType<typeof itemRestoreIntent>
) {
    const { item, shareId } = payload;
    const { itemId, revision } = item;
    const { callback: onItemRestoreProcessed } = meta;

    try {
        yield api({
            url: `pass/v1/share/${shareId}/item/untrash`,
            method: 'post',
            data: {
                Items: [{ ItemID: itemId, Revision: revision }],
            },
        });

        const itemRestoreSuccessAction = itemRestoreSuccess({ itemId, shareId });
        yield put(itemRestoreSuccessAction);

        onItemRestoreProcessed?.(itemRestoreSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemRestoreFailureAction = itemRestoreFailure({ itemId, shareId }, e);
        yield put(itemRestoreFailureAction);
        onItemRestoreProcessed?.(itemRestoreFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLatest(itemRestoreIntent, restoreItem, options);
}
