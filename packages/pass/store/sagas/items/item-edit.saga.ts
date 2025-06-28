import { call, put, select, takeEvery } from 'redux-saga/effects';

import { syncAliasMailboxes, syncAliasName, syncAliasSLNote } from '@proton/pass/lib/alias/alias.requests';
import { hasAttachments, hasHadAttachments } from '@proton/pass/lib/items/item.predicates';
import { editItem } from '@proton/pass/lib/items/item.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { aliasDetailsSync, filesResolve, itemEdit, itemEditDismiss } from '@proton/pass/store/actions';
import type { AliasDetailsState, AliasState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { itemLinkPendingFiles } from '@proton/pass/store/sagas/items/item-files.sagas';
import {
    selectAliasDetails,
    selectAliasOptions,
    selectItem,
    selectItemOrThrow,
    selectMailboxesForAlias,
} from '@proton/pass/store/selectors';
import { SelectorError } from '@proton/pass/store/selectors/errors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemEditIntent, ItemRevision, Maybe } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType } from '@proton/pass/types/data/telemetry';
import { prop } from '@proton/pass/utils/fp/lens';
import { or, truthy } from '@proton/pass/utils/fp/predicates';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { isEqual } from '@proton/pass/utils/set/is-equal';

function* aliasEditWorker(aliasEditIntent: ItemEditIntent<'alias'>) {
    if (!aliasEditIntent.extraData) return;

    const { itemId, shareId } = aliasEditIntent;

    const item: Maybe<ItemRevision<'alias'>> = yield select(selectItem(shareId, itemId));
    if (!item || !item.aliasEmail) throw new Error('Invalid item');

    const mailboxesForAlias: string[] = yield select(selectMailboxesForAlias(item.aliasEmail));
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
    if (slNoteChanged) yield syncAliasSLNote(item, nextSlNote);

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

function* itemEditWorker(options: RootSagaOptions, { payload: editIntent, meta }: ReturnType<typeof itemEdit.intent>) {
    const { itemId, shareId, lastRevision, files } = editIntent;
    const { onItemsUpdated, getTelemetry } = options;
    const telemetry = getTelemetry();
    const itemName = editIntent.metadata.name;

    try {
        /** assert item exists */
        yield select(selectItemOrThrow(shareId, itemId));

        if (editIntent.type === 'alias' && editIntent.extraData?.aliasOwner) yield call(aliasEditWorker, editIntent);

        let item: ItemRevision = yield editItem(editIntent, lastRevision);
        const shouldLink = files.toAdd.length || files.toRemove.length || files.toRestore?.length;
        if (shouldLink) item = yield itemLinkPendingFiles(item, files, options);

        yield put(itemEdit.success(meta.request.id, { item, itemId, shareId }));

        if (or(hasAttachments, hasHadAttachments)(item)) yield put(withRevalidate(filesResolve.intent(item)));

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

        onItemsUpdated?.();
    } catch (error) {
        if (error instanceof SelectorError) yield put(itemEditDismiss({ itemId, shareId, itemName }));
        yield put(itemEdit.failure(meta.request.id, error, { itemId, shareId }));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(itemEdit.intent.match, itemEditWorker, options);
}
