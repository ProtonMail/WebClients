import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { itemDeleteFailure, itemDeleteIntent, itemDeleteSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

function* deleteItem(
    { onItemsChange, getTelemetry }: WorkerRootSagaOptions,
    { payload }: ReturnType<typeof itemDeleteIntent>
) {
    const telemetry = getTelemetry();
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

        void telemetry?.pushEvent(createTelemetryEvent(TelemetryEventName.ItemDeletion, {}, { type: item.data.type }));
        yield put(itemDeleteSuccess({ itemId: item.itemId, shareId }));
        onItemsChange?.();
    } catch (e) {
        yield put(itemDeleteFailure({ itemId: item.itemId, shareId }, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(itemDeleteIntent.match, deleteItem, options);
}
