import { put, select } from 'redux-saga/effects';

import { hasAttachments, hasHadAttachments } from '@proton/pass/lib/items/item.predicates';
import { deleteItemRevisions, deleteItems } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { filesResolve, itemDelete, itemDeleteRevisions } from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectItem } from '@proton/pass/store/selectors';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { or } from '@proton/pass/utils/fp/predicates';

const removeItems = createRequestSaga({
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
        return { ...selectedItem, hadFiles: or(hasAttachments, hasHadAttachments)(item) };
    },
});

const removeRevisions = createRequestSaga({
    actions: itemDeleteRevisions,
    call: function* (dto) {
        const { shareId, itemId } = dto;
        const item: ItemRevision = yield deleteItemRevisions(dto);
        yield put(withRevalidate(filesResolve.intent({ ...dto, revision: item.revision })));

        return { shareId, itemId, item };
    },
});

export default [removeItems, removeRevisions];
