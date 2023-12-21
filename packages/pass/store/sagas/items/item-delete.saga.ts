import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { itemDeleteFailure, itemDeleteIntent, itemDeleteSuccess } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';

function* deleteItem(
    { onItemsUpdated, getTelemetry }: RootSagaOptions,
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

        void telemetry?.push(createTelemetryEvent(TelemetryEventName.ItemDeletion, {}, { type: TelemetryItemType[item.data.type] }));
        yield put(itemDeleteSuccess({ itemId: item.itemId, shareId }));
        onItemsUpdated?.();
    } catch (e) {
        yield put(itemDeleteFailure({ itemId: item.itemId, shareId }, e));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemDeleteIntent.match, deleteItem, options);
}
