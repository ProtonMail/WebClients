import type { Action } from 'redux';
import { all, put, takeEvery } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { createAlias, createItem, createItemWithAlias } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { itemCreationFailure, itemCreationIntent, itemCreationSuccess } from '@proton/pass/store/actions';
import { aliasOptionsRequest } from '@proton/pass/store/actions/requests';
import { requestInvalidate } from '@proton/pass/store/request/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

type ItemCreationAction = ReturnType<typeof itemCreationIntent>;
type ItemWithAliasCreationAction = ItemCreationAction & { payload: { type: 'login'; extraData: { withAlias: true } } };

const singleItemCreation = (action: Action): action is ItemCreationAction =>
    itemCreationIntent.match(action) && (action.payload.type === 'login' ? !action.payload.extraData.withAlias : true);

const withAliasItemCreation = (action: Action): action is ItemWithAliasCreationAction =>
    itemCreationIntent.match(action) && action.payload.type === 'login' && action.payload.extraData.withAlias;

function* singleItemCreationWorker({ onItemsUpdated, getTelemetry }: RootSagaOptions, action: ItemCreationAction) {
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
        yield isAlias && put(requestInvalidate(aliasOptionsRequest(shareId))); /* reset alias options */

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[item.data.type] })
        );

        if (item.data.type === 'login' && deobfuscate(item.data.content.totpUri)) {
            void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
        }

        onItemCreationIntentProcessed?.(itemCreationSuccessAction);
        onItemsUpdated?.();
    } catch (e) {
        const itemCreationFailureAction = itemCreationFailure({ optimisticId, shareId }, e);
        yield put(itemCreationFailureAction);

        onItemCreationIntentProcessed?.(itemCreationFailureAction);
    }
}

function* withAliasCreationWorker(
    { onItemsUpdated, getTelemetry }: RootSagaOptions,
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
        yield put(requestInvalidate(aliasOptionsRequest(shareId))); /* reset alias options */

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[loginItem.data.type] })
        );
        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[aliasItem.data.type] })
        );
        if (loginItem.data.type === 'login' && deobfuscate(loginItem.data.content.totpUri)) {
            void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
        }

        onItemsUpdated?.();
    } catch (err: unknown) {
        const itemCreationFailureAction = itemCreationFailure({ optimisticId, shareId }, err);
        yield put(itemCreationFailureAction);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield all([
        takeEvery(singleItemCreation, singleItemCreationWorker, options),
        takeEvery(withAliasItemCreation, withAliasCreationWorker, options),
    ]);
}
