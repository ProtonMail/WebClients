import type { AnyAction } from 'redux';
import { all, put, takeEvery } from 'redux-saga/effects';

import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { acknowledgeRequest, itemCreationFailure, itemCreationIntent, itemCreationSuccess } from '../actions';
import { aliasOptions } from '../actions/requests';
import type { WorkerRootSagaOptions } from '../types';
import { createAlias, createItem, createItemWithAlias, parseItemRevision } from './workers/items';

type ItemCreationAction = ReturnType<typeof itemCreationIntent>;
type ItemWithAliasCreationAction = ItemCreationAction & { payload: { type: 'login'; extraData: { withAlias: true } } };

const singleItemCreation = (action: AnyAction): action is ItemCreationAction =>
    itemCreationIntent.match(action) && (action.payload.type === 'login' ? !action.payload.extraData.withAlias : true);

const withAliasItemCreation = (action: AnyAction): action is ItemWithAliasCreationAction =>
    itemCreationIntent.match(action) && action.payload.type === 'login' && action.payload.extraData.withAlias;

function* singleItemCreationWorker({ onItemsChange, telemetry }: WorkerRootSagaOptions, action: ItemCreationAction) {
    const {
        payload: createIntent,
        meta: { callback: onItemCreationIntentProcessed },
    } = action;
    const { shareId, optimisticId } = createIntent;

    const isAlias = createIntent.type === 'alias';

    try {
        const encryptedItem: ItemRevisionContentsResponse = yield isAlias
            ? createAlias(createIntent)
            : createItem(createIntent);

        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);

        const itemCreationSuccessAction = itemCreationSuccess({ optimisticId, shareId, item });
        yield put(itemCreationSuccessAction);
        yield isAlias && put(acknowledgeRequest(aliasOptions())); /* reset alias options */

        telemetry?.(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: item.data.type }));
        onItemCreationIntentProcessed?.(itemCreationSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemCreationfailureAction = itemCreationFailure({ optimisticId, shareId }, e);
        yield put(itemCreationfailureAction);

        onItemCreationIntentProcessed?.(itemCreationfailureAction);
    }
}

function* withAliasCreationWorker(
    { onItemsChange, telemetry }: WorkerRootSagaOptions,
    { payload: createIntent }: ItemWithAliasCreationAction
) {
    const { shareId, optimisticId } = createIntent;
    try {
        const [encryptedLoginItem, encryptedAliasItem]: ItemRevisionContentsResponse[] = yield createItemWithAlias(
            createIntent
        );

        const loginItem: ItemRevision = yield parseItemRevision(shareId, encryptedLoginItem);
        const aliasItem: ItemRevision = yield parseItemRevision(shareId, encryptedAliasItem);

        yield put(itemCreationSuccess({ optimisticId, shareId, item: loginItem, alias: aliasItem }));
        yield put(acknowledgeRequest(aliasOptions())); /* reset alias options */

        telemetry?.(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: loginItem.data.type }));
        telemetry?.(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: aliasItem.data.type }));

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
