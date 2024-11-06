import { call, put, select, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { editItem } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { aliasDetailsSync, itemEditFailure, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import type { AliasDetailsState, AliasState } from '@proton/pass/store/reducers';
import { selectAliasDetails, selectAliasMailboxes, selectAliasOptions, selectItem } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemEditIntent, ItemRevision, ItemRevisionContentsResponse } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEqual } from '@proton/pass/utils/set/is-equal';

function* aliasEditWorker(aliasEditIntent: ItemEditIntent<'alias'>) {
    if (!aliasEditIntent.extraData) return;

    const { itemId, shareId } = aliasEditIntent;

    const item: ItemRevision<'alias'> = yield select(selectItem(shareId, itemId));
    const mailboxesForAlias: string[] = yield select(selectAliasMailboxes(item.aliasEmail!));
    const aliasOptions: AliasState['aliasOptions'] = yield select(selectAliasOptions);
    const aliasDetails: AliasDetailsState = yield select(selectAliasDetails(item.aliasEmail!));

    const currentMailboxIds = new Set(
        mailboxesForAlias
            .map((mailbox) => aliasOptions?.mailboxes.find(({ email }) => email === mailbox)?.id)
            .filter(Boolean) as number[]
    );

    const nextMailboxes = aliasEditIntent.extraData.mailboxes;
    const nextMailboxIds = new Set(nextMailboxes.map(({ id }) => id));

    const mailboxesChanged = !isEqual(currentMailboxIds, nextMailboxIds);

    /* only update the mailboxes if there is a change */
    if (mailboxesChanged) {
        yield api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/mailbox`,
            method: 'post',
            data: {
                MailboxIDs: Array.from(nextMailboxIds.values()),
            },
        });
    }

    const currentDisplayName = aliasDetails?.name;
    const nextDisplayName = aliasEditIntent.extraData.displayName;
    const displayNameChanged = currentDisplayName !== nextDisplayName;

    if (displayNameChanged) {
        yield api({
            url: `pass/v1/share/${shareId}/alias/${itemId}/name`,
            method: 'put',
            data: {
                Name: nextDisplayName,
            },
        });
    }

    if (mailboxesChanged || displayNameChanged) {
        yield put(
            aliasDetailsSync({
                aliasEmail: item.aliasEmail!,
                ...aliasDetails,
                mailboxes: nextMailboxes,
                name: nextDisplayName,
            })
        );
    }
}

function* itemEditWorker(
    { onItemsUpdated, getTelemetry }: RootSagaOptions,
    { payload: editIntent, meta: { callback: onItemEditIntentProcessed } }: ReturnType<typeof itemEditIntent>
) {
    const { itemId, shareId, lastRevision } = editIntent;
    const telemetry = getTelemetry();

    try {
        if (editIntent.type === 'alias' && editIntent.extraData?.aliasOwner) {
            yield call(aliasEditWorker, editIntent);
        }

        const encryptedItem: ItemRevisionContentsResponse = yield editItem(editIntent, lastRevision);
        const item: ItemRevision = yield parseItemRevision(shareId, encryptedItem);

        const itemEditSuccessAction = itemEditSuccess({ item, itemId, shareId });
        yield put(itemEditSuccessAction);

        void telemetry?.push(
            createTelemetryEvent(TelemetryEventName.ItemUpdate, {}, { type: TelemetryItemType[item.data.type] })
        );

        if (item.data.type === 'login' && editIntent.type === 'login') {
            const prevTotp = deobfuscate(editIntent.content.totpUri);
            const nextTotp = deobfuscate(item.data.content.totpUri);

            if (nextTotp && prevTotp !== nextTotp) {
                void telemetry?.push(createTelemetryEvent(TelemetryEventName.TwoFAUpdate, {}, {}));
            }
        }

        onItemEditIntentProcessed?.(itemEditSuccessAction);
        onItemsUpdated?.();
    } catch (e) {
        const itemEditFailureAction = itemEditFailure({ itemId, shareId }, e);
        yield put(itemEditFailureAction);

        onItemEditIntentProcessed?.(itemEditFailureAction);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemEditIntent.match, itemEditWorker, options);
}
