import type { Action } from 'redux';
import { all, put, select, takeEvery } from 'redux-saga/effects';

import { hasAttachments } from '../../../lib/items/item.predicates';
import type { ItemRevisionWithAlias } from '../../../lib/items/item.requests';
import { createAlias, createItem, createItemWithAlias } from '../../../lib/items/item.requests';
import { createTelemetryEvent } from '../../../lib/telemetry/utils';
import type { ItemRevision } from '../../../types/data/items';
import { TelemetryEventName, TelemetryItemType } from '../../../types/data/telemetry';
import { deobfuscate } from '../../../utils/obfuscate/xor';
import { filesResolve } from '../../actions/creators/files';
import { itemCreate, itemCreateDismiss } from '../../actions/creators/item';
import { withIntentSender } from '../../actions/enhancers/endpoint';
import { withRevalidate } from '../../request/enhancers';
import { SelectorError } from '../../selectors/errors';
import { selectShareOrThrow } from '../../selectors/shares';
import type { RootSagaOptions } from '../../types';
import { itemLinkPendingFiles } from './item-files.sagas';

type ItemCreationAction = ReturnType<typeof itemCreate.intent>;
type ItemWithAliasCreationAction = ItemCreationAction & { payload: { type: 'login'; extraData: { withAlias: true } } };

const singleItemCreation = (action: Action): action is ItemCreationAction =>
    itemCreate.intent.match(action) && (action.payload.type === 'login' ? !action.payload.extraData.withAlias : true);

const withAliasItemCreation = (action: Action): action is ItemWithAliasCreationAction =>
    itemCreate.intent.match(action) && action.payload.type === 'login' && action.payload.extraData.withAlias;

function* singleItemCreationWorker(options: RootSagaOptions, action: ItemCreationAction) {
    const telemetry = options.getTelemetry();

    const { payload: createIntent, meta } = action;
    const { shareId, optimisticId, files } = createIntent;
    const isAlias = createIntent.type === 'alias';
    const shouldLink = files.toAdd.length > 0;
    const itemName = action.payload.metadata.name;

    try {
        yield select(selectShareOrThrow(shareId)); /** assert share exists */

        let item: ItemRevision = yield isAlias ? createAlias(createIntent) : createItem(createIntent);
        if (shouldLink) item = yield itemLinkPendingFiles(item, files, options);

        yield put(itemCreate.success(meta.request.id, { optimisticId, shareId, item }));
        if (hasAttachments(item)) yield put(withRevalidate(filesResolve.intent(item)));

        const hasTotp = item.data.type === 'login' && deobfuscate(item.data.content.totpUri);
        void telemetry?.push(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[item.data.type] }));
        if (hasTotp) void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
    } catch (error) {
        if (error instanceof SelectorError) yield put(itemCreateDismiss({ optimisticId, shareId, itemName }));
        yield put(withIntentSender(itemCreate.failure(meta.request.id, error, { optimisticId, shareId }), action));
    }
}

function* withAliasCreationWorker(options: RootSagaOptions, action: ItemWithAliasCreationAction) {
    const { getTelemetry } = options;
    const telemetry = getTelemetry();

    const { payload: createIntent, meta } = action;
    const { shareId, optimisticId, files } = createIntent;
    const shouldLink = files.toAdd.length > 0;

    try {
        let [loginItem, aliasItem]: ItemRevisionWithAlias = yield createItemWithAlias(createIntent);
        if (shouldLink) loginItem = yield itemLinkPendingFiles(loginItem, files, options);
        const { content } = loginItem.data;

        yield put(itemCreate.success(meta.request.id, { optimisticId, shareId, item: loginItem, alias: aliasItem }));
        if (hasAttachments(loginItem)) yield put(withRevalidate(filesResolve.intent(loginItem)));

        void telemetry?.push(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[loginItem.data.type] }));
        void telemetry?.push(createTelemetryEvent(TelemetryEventName.ItemCreation, {}, { type: TelemetryItemType[aliasItem.data.type] }));
        if (deobfuscate(content.totpUri)) void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFACreation, {}, {}));
    } catch (error) {
        yield put(withIntentSender(itemCreate.failure(meta.request.id, error, { optimisticId, shareId }), action));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield all([
        takeEvery(singleItemCreation, singleItemCreationWorker, options),
        takeEvery(withAliasItemCreation, withAliasCreationWorker, options),
    ]);
}
