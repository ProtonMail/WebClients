import type { Action } from 'redux';
import { all, put, select, takeEvery } from 'redux-saga/effects';

import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import type { ItemRevisionWithAlias } from '@proton/pass/lib/items/item.requests';
import { createAlias, createItem, createItemWithAlias } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { filesResolve, itemCreate, itemCreateDismiss } from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { itemLinkPendingFiles } from '@proton/pass/store/sagas/items/item-files.sagas';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import { SelectorError } from '@proton/pass/store/selectors/errors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

type ItemCreationAction = ReturnType<typeof itemCreate.intent>;
type ItemWithAliasCreationAction = ItemCreationAction & { payload: { type: 'login'; extraData: { withAlias: true } } };

const singleItemCreation = (action: Action): action is ItemCreationAction =>
    itemCreate.intent.match(action) && (action.payload.type === 'login' ? !action.payload.extraData.withAlias : true);

const withAliasItemCreation = (action: Action): action is ItemWithAliasCreationAction =>
    itemCreate.intent.match(action) && action.payload.type === 'login' && action.payload.extraData.withAlias;

function* singleItemCreationWorker(options: RootSagaOptions, action: ItemCreationAction) {
    const { onItemsUpdated, getTelemetry } = options;
    const telemetry = getTelemetry();

    const { payload: createIntent, meta } = action;
    const { shareId, optimisticId, files } = createIntent;
    const isAlias = createIntent.type === 'alias';
    const shouldLink = files.toAdd.length > 0;
    const itemName = action.payload.metadata.name;

    try {
        /** assert share exists */
        yield select(selectShareOrThrow(shareId));

        let item: ItemRevision = yield isAlias ? createAlias(createIntent) : createItem(createIntent);
        if (shouldLink) item = yield itemLinkPendingFiles(item, files, options);

        yield put(itemCreate.success(meta.request.id, { optimisticId, shareId, item }));
        if (hasAttachments(item)) yield put(withRevalidate(filesResolve.intent(item)));

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[item.data.type] })
        );

        if (item.data.type === 'login' && deobfuscate(item.data.content.totpUri)) {
            void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
        }

        onItemsUpdated?.();
    } catch (error) {
        if (error instanceof SelectorError) yield put(itemCreateDismiss({ optimisticId, shareId, itemName }));
        yield put(itemCreate.failure(meta.request.id, error, { optimisticId, shareId }));
    }
}

function* withAliasCreationWorker(
    options: RootSagaOptions,
    { payload: createIntent, meta }: ItemWithAliasCreationAction
) {
    const { onItemsUpdated, getTelemetry } = options;
    const telemetry = getTelemetry();

    const { shareId, optimisticId, files } = createIntent;
    const shouldLink = files.toAdd.length > 0;

    try {
        let [loginItem, aliasItem]: ItemRevisionWithAlias = yield createItemWithAlias(createIntent);
        if (shouldLink) loginItem = yield itemLinkPendingFiles(loginItem, files, options);

        yield put(itemCreate.success(meta.request.id, { optimisticId, shareId, item: loginItem, alias: aliasItem }));
        if (hasAttachments(loginItem)) yield put(withRevalidate(filesResolve.intent(loginItem)));

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[loginItem.data.type] })
        );

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[aliasItem.data.type] })
        );

        if (deobfuscate(loginItem.data.content.totpUri)) {
            void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
        }

        onItemsUpdated?.();
    } catch (error) {
        yield put(itemCreate.failure(meta.request.id, error, { optimisticId, shareId }));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield all([
        takeEvery(singleItemCreation, singleItemCreationWorker, options),
        takeEvery(withAliasItemCreation, withAliasCreationWorker, options),
    ]);
}
