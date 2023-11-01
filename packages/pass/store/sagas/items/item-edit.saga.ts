import { call, put, select, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { editItem } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { aliasDetailsSync, itemEditFailure, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import type { AliasState } from '@proton/pass/store/reducers';
import { selectAliasDetails, selectAliasOptions, selectItemByShareIdAndId } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemEditIntent, ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEqual } from '@proton/pass/utils/set/is-equal';

function* editMailboxesWorker(aliasEditIntent: ItemEditIntent<'alias'>) {
    const { itemId, shareId } = aliasEditIntent;

    const item: ItemRevision<'alias'> = yield select(selectItemByShareIdAndId(shareId, itemId));
    const mailboxesForAlias: string[] = yield select(selectAliasDetails(item.aliasEmail!));
    const aliasOptions: AliasState['aliasOptions'] = yield select(selectAliasOptions);

    const currentMailboxIds = new Set(
        mailboxesForAlias
            .map((mailbox) => aliasOptions?.mailboxes.find(({ email }) => email === mailbox)?.id)
            .filter(Boolean) as number[]
    );

    const nextMailboxIds = new Set(aliasEditIntent.extraData.mailboxes.map(({ id }) => id));

    /* only update the mailboxes if there is a change */
    if (!isEqual(currentMailboxIds, nextMailboxIds)) {
        yield api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/mailbox`,
            method: 'post',
            data: {
                MailboxIDs: Array.from(nextMailboxIds.values()),
            },
        });

        yield put(
            aliasDetailsSync({
                aliasEmail: item.aliasEmail!,
                mailboxes: aliasEditIntent.extraData.mailboxes,
            })
        );
    }
}
function* itemEditWorker(
    { onItemsChange, getTelemetry }: WorkerRootSagaOptions,
    { payload: editIntent, meta: { callback: onItemEditIntentProcessed } }: ReturnType<typeof itemEditIntent>
) {
    const { itemId, shareId, lastRevision } = editIntent;
    const telemetry = getTelemetry();

    try {
        if (editIntent.type === 'alias' && editIntent.extraData.aliasOwner) yield call(editMailboxesWorker, editIntent);

        const encryptedItem: ItemRevisionContentsResponse = yield editItem(editIntent, lastRevision);
        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);

        const itemEditSuccessAction = itemEditSuccess({ item, itemId, shareId });
        yield put(itemEditSuccessAction);

        void telemetry?.pushEvent(createTelemetryEvent(TelemetryEventName.ItemUpdate, {}, { type: item.data.type }));

        if (item.data.type === 'login' && editIntent.type === 'login') {
            const prevTotp = editIntent.content.totpUri;
            const nextTotp = item.data.content.totpUri;
            if (nextTotp && prevTotp !== nextTotp) {
                void telemetry?.pushEvent(createTelemetryEvent(TelemetryEventName.TwoFAUpdate, {}, {}));
            }
        }

        onItemEditIntentProcessed?.(itemEditSuccessAction);
        onItemsChange?.();
    } catch (e) {
        const itemEditFailureAction = itemEditFailure({ itemId, shareId }, e);
        yield put(itemEditFailureAction);

        onItemEditIntentProcessed?.(itemEditFailureAction);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(itemEditIntent.match, itemEditWorker, options);
}
