import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { itemDeleteFailure, itemDeleteIntent, itemDeleteSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* deleteItem(
    { onItemsChange, telemetry }: WorkerRootSagaOptions,
    { payload }: ReturnType<typeof itemDeleteIntent>
) {
    const { item, shareId } = payload;

    try {
        yield api({
            url: `pass/v1/share/${payload.shareId}/item`,
            method: 'delete',
            data: {
                Items: [
                    {
                        ItemID: item.itemId,
                        Revision: item.revision,
                    },
                ],
            },
        });

        telemetry?.(createTelemetryEvent(TelemetryEventName.ItemDeletion, {}, { type: item.data.type }));
        yield put(itemDeleteSuccess({ itemId: item.itemId, shareId }));
        onItemsChange?.();
    } catch (e) {
        yield put(itemDeleteFailure({ itemId: item.itemId, shareId }, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(itemDeleteIntent.match, deleteItem, options);
}
