import type { Action } from 'redux';
import { all, put, takeEvery } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { createAlias, createItem, createItemWithAlias } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { fileLinkPending, itemCreate } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

type ItemCreationAction = ReturnType<typeof itemCreate.intent>;
type ItemWithAliasCreationAction = ItemCreationAction & { payload: { type: 'login'; extraData: { withAlias: true } } };

const singleItemCreation = (action: Action): action is ItemCreationAction =>
    itemCreate.intent.match(action) && (action.payload.type === 'login' ? !action.payload.extraData.withAlias : true);

const withAliasItemCreation = (action: Action): action is ItemWithAliasCreationAction =>
    itemCreate.intent.match(action) && action.payload.type === 'login' && action.payload.extraData.withAlias;

function* singleItemCreationWorker({ onItemsUpdated, getTelemetry }: RootSagaOptions, action: ItemCreationAction) {
    const { payload: createIntent, meta } = action;
    const { shareId, optimisticId } = createIntent;
    const isAlias = createIntent.type === 'alias';
    const telemetry = getTelemetry();

    try {
        const encryptedItem: ItemRevisionContentsResponse = yield isAlias
            ? createAlias(createIntent)
            : createItem(createIntent);

        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);
        yield put(itemCreate.success(meta.request.id, { optimisticId, shareId, item }));

        if (createIntent.files.toAdd.length) {
            yield put(
                fileLinkPending.intent({
                    shareId,
                    itemId: item.itemId,
                    revision: item.revision,
                    files: createIntent.files,
                })
            );
        }

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[item.data.type] })
        );

        if (item.data.type === 'login' && deobfuscate(item.data.content.totpUri)) {
            void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
        }

        onItemsUpdated?.();
    } catch (error) {
        yield put(itemCreate.failure(meta.request.id, error, { optimisticId, shareId }));
    }
}

function* withAliasCreationWorker(
    { onItemsUpdated, getTelemetry }: RootSagaOptions,
    { payload: createIntent, meta }: ItemWithAliasCreationAction
) {
    const { shareId, optimisticId } = createIntent;
    const telemetry = getTelemetry();
    try {
        const [encryptedLoginItem, encryptedAliasItem]: ItemRevisionContentsResponse[] =
            yield createItemWithAlias(createIntent);

        const loginItem: ItemRevision = yield parseItemRevision(shareId, encryptedLoginItem);
        const aliasItem: ItemRevision = yield parseItemRevision(shareId, encryptedAliasItem);

        yield put(itemCreate.success(meta.request.id, { optimisticId, shareId, item: loginItem, alias: aliasItem }));

        if (createIntent.files.toAdd.length) {
            yield put(
                fileLinkPending.intent({
                    shareId,
                    itemId: loginItem.itemId,
                    revision: loginItem.revision,
                    files: createIntent.files,
                })
            );
        }

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
