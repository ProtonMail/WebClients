import { call, put, select, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { createTelemetryEvent } from '@proton/pass/telemetry/events';
import type { ItemEditIntent, ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import { isEqual } from '@proton/pass/utils/set/is-equal';

import { aliasDetailsEditSuccess, itemEditFailure, itemEditIntent, itemEditSuccess } from '../actions';
import type { AliasState } from '../reducers';
import { selectAliasOptions, selectItemByShareIdAndId, selectMailboxesForAlias } from '../selectors';
import type { WorkerRootSagaOptions } from '../types';
import { editItem, parseItemRevision } from './workers/items';

function* editMailboxesWorker(aliasEditIntent: ItemEditIntent<'alias'>) {
    const { itemId, shareId } = aliasEditIntent;

    const item: ItemRevision<'alias'> = yield select(selectItemByShareIdAndId(shareId, itemId));
    const mailboxesForAlias: string[] = yield select(selectMailboxesForAlias(item.aliasEmail!));
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
            aliasDetailsEditSuccess({
                aliasEmail: item.aliasEmail!,
                mailboxes: aliasEditIntent.extraData.mailboxes,
            })
        );
    }
}
function* itemEditWorker(
    { onItemsChange, telemetry }: WorkerRootSagaOptions,
    { payload: editIntent, meta: { callback: onItemEditIntentProcessed } }: ReturnType<typeof itemEditIntent>
) {
    const { itemId, shareId, lastRevision } = editIntent;

    try {
        if (editIntent.type === 'alias') {
            yield call(editMailboxesWorker, editIntent);
        }

        const encryptedItem: ItemRevisionContentsResponse = yield editItem(editIntent, lastRevision);
        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);

        const itemEditSuccessAction = itemEditSuccess({ item, itemId, shareId });
        yield put(itemEditSuccessAction);

        telemetry?.(createTelemetryEvent(TelemetryEventName.ItemUpdate, {}, { type: item.data.type }));
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
