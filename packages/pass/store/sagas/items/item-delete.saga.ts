import { call, put, select } from 'redux-saga/effects';

import { hasAttachments, hasHadAttachments } from '../../../lib/items/item.predicates';
import { deleteItemRevisions, deleteItems } from '../../../lib/items/item.requests';
import { createTelemetryEvent } from '../../../lib/telemetry/utils';
import type { ItemRevision, Maybe } from '../../../types';
import { TelemetryEventName, TelemetryItemType } from '../../../types/data/telemetry';
import { or } from '../../../utils/fp/predicates';
import { filesResolve, itemDelete, itemDeleteRevisions } from '../../actions';
import { withRevalidate } from '../../request/enhancers';
import { createRequestSaga } from '../../request/sagas';
import { selectItem } from '../../selectors';

const removeItems = createRequestSaga({
    actions: itemDelete,
    call: function* (selectedItem, { getTelemetry }) {
        const { shareId, itemId } = selectedItem;
        const telemetry = getTelemetry();

        const item: Maybe<ItemRevision> = yield select(selectItem(shareId, itemId));
        if (!item) throw new Error('Invalid delete action');

        yield call(deleteItems, [item]);

        void telemetry?.push(
            createTelemetryEvent(
                TelemetryEventName.ItemDeletion,
                {},
                {
                    type: TelemetryItemType[item.data.type],
                }
            )
        );

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
