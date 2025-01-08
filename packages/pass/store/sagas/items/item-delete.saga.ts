import { select } from 'redux-saga/effects';

import { deleteItems } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { itemDelete } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';

export default createRequestSaga({
    actions: itemDelete,
    call: function* (selectedItem, { onItemsUpdated, getTelemetry }) {
        const { shareId, itemId } = selectedItem;
        const telemetry = getTelemetry();

        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Invalid delete action');

        yield deleteItems([item]);

        void telemetry?.push(
            createTelemetryEvent(
                TelemetryEventName.ItemDeletion,
                {},
                {
                    type: TelemetryItemType[item.data.type],
                }
            )
        );

        onItemsUpdated?.();
        return selectedItem;
    },
});
