import type { AnyAction } from 'redux';
import { all, put, takeEvery } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { createAlias, createItem, createItemWithAlias } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import {
    invalidateRequest,
    itemCreationFailure,
    itemCreationIntent,
    itemCreationSuccess,
} from '@proton/pass/store/actions';
import { aliasOptionsRequest } from '@proton/pass/store/actions/requests';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

type ItemCreationAction = ReturnType<typeof itemCreationIntent>;
type ItemWithAliasCreationAction = ItemCreationAction & { payload: { type: 'login'; extraData: { withAlias: true } } };

const singleItemCreation = (action: AnyAction): action is ItemCreationAction =>
    itemCreationIntent.match(action) && (action.payload.type === 'login' ? !action.payload.extraData.withAlias : true);

const withAliasItemCreation = (action: AnyAction): action is ItemWithAliasCreationAction =>
    itemCreationIntent.match(action) && action.payload.type === 'login' && action.payload.extraData.withAlias;

function* singleItemCreationWorker({ onItemsChange, getTelemetry }: WorkerRootSagaOptions, action: ItemCreationAction) {
    const {
        payload: createIntent,
        meta: { callback: onItemCreationIntentProcessed },
    } = action;
    const { shareId, optimisticId } = createIntent;
    const isAlias = createIntent.type === 'alias';
    const telemetry = getTelemetry();

    try {
        const encryptedItem: ItemRevisionContentsResponse = yield isAlias
            ? createAlias(createIntent)
            : createItem(createIntent);

        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);

        const itemCreationSuccessAction = itemCreationSuccess({ optimisticId, shareId, item });
        yield put(itemCreationSuccessAction);
        yield isAlias && put(invalidateRequest(aliasOptionsRequest(shareId))); /* reset alias options */

        void telemetry?.pushEvent(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: item.data.type }));
        onItemCreationIntentProcessed?.(itemCreationSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemCreationfailureAction = itemCreationFailure({ optimisticId, shareId }, e);
        yield put(itemCreationfailureAction);

        onItemCreationIntentProcessed?.(itemCreationfailureAction);
    }
}

function* withAliasCreationWorker(
    { onItemsChange, getTelemetry }: WorkerRootSagaOptions,
    { payload: createIntent }: ItemWithAliasCreationAction
) {
    const { shareId, optimisticId } = createIntent;
    const telemetry = getTelemetry();
    try {
        const [encryptedLoginItem, encryptedAliasItem]: ItemRevisionContentsResponse[] =
            yield createItemWithAlias(createIntent);

        const loginItem: ItemRevision = yield parseItemRevision(shareId, encryptedLoginItem);
        const aliasItem: ItemRevision = yield parseItemRevision(shareId, encryptedAliasItem);

        yield put(itemCreationSuccess({ optimisticId, shareId, item: loginItem, alias: aliasItem }));
        yield put(invalidateRequest(aliasOptionsRequest(shareId))); /* reset alias options */

        void telemetry?.pushEvent(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: loginItem.data.type })
        );
        void telemetry?.pushEvent(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: aliasItem.data.type })
        );

        onItemsChange?.();
    } catch (e) {
        const itemCreationfailureAction = itemCreationFailure({ optimisticId, shareId }, e);
        yield put(itemCreationfailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield all([
        takeEvery(singleItemCreation, singleItemCreationWorker, options),
        takeEvery(withAliasItemCreation, withAliasCreationWorker, options),
    ]);
}
