import { call, put, select, takeEvery } from 'redux-saga/effects';

import { syncAliasMailboxes, syncAliasName, syncAliasSLNote } from '@proton/pass/lib/alias/alias.requests';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { editItem } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/event';
import { aliasDetailsSync, itemEditFailure, itemEditIntent, itemEditSuccess } from '@proton/pass/store/actions';
import type { AliasDetailsState, AliasState } from '@proton/pass/store/reducers';
import { selectAliasDetails, selectAliasMailboxes, selectAliasOptions, selectItem } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemEditIntent, ItemRevision, ItemRevisionContentsResponse, Maybe } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEqual } from '@proton/pass/utils/set/is-equal';

function* aliasEditWorker(aliasEditIntent: ItemEditIntent<'alias'>) {
    if (!aliasEditIntent.extraData) return;

    const { itemId, shareId } = aliasEditIntent;

    const item: Maybe<ItemRevision<'alias'>> = yield select(selectItem(shareId, itemId));
    if (!item || !item.aliasEmail) throw new Error('Invalid item');

    const mailboxesForAlias: string[] = yield select(selectAliasMailboxes(item.aliasEmail));
    const aliasOptions: AliasState['aliasOptions'] = yield select(selectAliasOptions);
    const aliasDetails: Maybe<AliasDetailsState> = yield select(selectAliasDetails(item.aliasEmail));

    const currentMailboxIds = new Set(
        mailboxesForAlias
            .map((mailbox) => aliasOptions?.mailboxes.find(({ email }) => email === mailbox)?.id)
            .filter(truthy)
    );

    const nextSlNote = aliasEditIntent.extraData.slNote;
    const nextMailboxes = aliasEditIntent.extraData.mailboxes;
    const nextMailboxIds = new Set(nextMailboxes.map(prop('id')));
    const nextDisplayName = aliasEditIntent.extraData.displayName;

    const nameChanged = aliasDetails?.name !== nextDisplayName;
    const mailboxesChanged = !isEqual(currentMailboxIds, nextMailboxIds);
    const slNoteChanged = aliasDetails?.slNote !== nextSlNote;

    if (mailboxesChanged) yield syncAliasMailboxes(item, Array.from(nextMailboxIds.values()));
    if (nameChanged) yield syncAliasName(item, nextDisplayName);
    if (slNoteChanged) yield syncAliasSLNote(item, nextDisplayName);

    if (mailboxesChanged || nameChanged || slNoteChanged) {
        yield put(
            aliasDetailsSync({
                aliasEmail: item.aliasEmail,
                ...aliasDetails,
                mailboxes: nextMailboxes,
                name: nextDisplayName,
                slNote: nextSlNote,
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
