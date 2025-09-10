import type { Action, Reducer } from 'redux';

import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { getItemEntityID } from '@proton/pass/lib/items/item.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import {
    aliasSyncPending,
    aliasSyncStatusToggle,
    bootSuccess,
    draftDiscard,
    draftSave,
    draftsGarbageCollect,
    emptyTrashProgress,
    fileLinkPending,
    importItemsProgress,
    inviteAccept,
    itemAutofilled,
    itemBulkDeleteProgress,
    itemBulkMoveProgress,
    itemBulkRestoreProgress,
    itemBulkTrashProgress,
    itemCreate,
    itemCreateDismiss,
    itemDelete,
    itemDeleteRevisions,
    itemEdit,
    itemEditDismiss,
    itemMove,
    itemPinSuccess,
    itemRestore,
    itemTrash,
    itemUnpinSuccess,
    itemsDeleteEvent,
    itemsEditEvent,
    itemsUsedEvent,
    resolveAddressMonitor,
    restoreTrashProgress,
    secureLinkCreate,
    secureLinkRemove,
    secureLinksGet,
    secureLinksRemoveInactive,
    setItemFlags,
    shareEventDelete,
    shareLeaveSuccess,
    sharesEventNew,
    syncSuccess,
    vaultDeleteSuccess,
    vaultMoveAllItemsProgress,
} from '@proton/pass/store/actions';
import type { WrappedOptimisticState } from '@proton/pass/store/optimistic/types';
import { combineOptimisticReducers } from '@proton/pass/store/optimistic/utils/combine-optimistic-reducers';
import withOptimistic from '@proton/pass/store/optimistic/with-optimistic';
import type {
    IndexedByShareIdAndItemId,
    ItemId,
    ItemRevision,
    ItemType,
    RequiredProps,
    SecureLink,
    ShareId,
    UniqueItem,
} from '@proton/pass/types';
import { ContentFormatVersion, ItemFlag, ItemState } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { eq, not, notIn, or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { objectMap } from '@proton/pass/utils/object/map';
import { fullMerge, partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { toMap } from '@proton/shared/lib/helpers/object';

/** itemIds are only guaranteed to be unique per share not globally,
 * therefore we must index the item entries by `shareId`  */
export type ItemsByShareId = IndexedByShareIdAndItemId<ItemRevision>;
export type ItemRevisionUpdate = RequiredProps<Partial<ItemRevision>, 'itemId' | 'shareId'>;

/** Updates an existing item in the state if both
 * the shareId and itemId already exist */
export const updateItem =
    ({ shareId, itemId, ...update }: ItemRevisionUpdate) =>
    (state: ItemsByShareId) =>
        state[shareId]?.[itemId] ? partialMerge(state, { [shareId]: { [itemId]: update } }) : state;

/** Applies a batch of item updates to the state,
 * ensuring each of them previously existed */
export const updateItems = (data: ItemRevisionUpdate[]) => (state: ItemsByShareId) => {
    const updates = data.filter(({ shareId, itemId }) => Boolean(state[shareId]?.[itemId]));
    if (updates.length === 0) return state;

    return partialMerge(
        state,
        updates.reduce<IndexedByShareIdAndItemId<Partial<ItemRevision>>>((acc, { shareId, itemId, ...update }) => {
            acc[shareId] = acc[shareId] ?? {};
            acc[shareId][itemId] = update;
            return acc;
        }, {})
    );
};

export const addItems = (data: ItemRevision[]) => (state: ItemsByShareId) =>
    fullMerge(
        state,
        data.reduce<IndexedByShareIdAndItemId<ItemRevision>>((acc, item) => {
            const { shareId, itemId } = item;
            acc[shareId] = acc[shareId] ?? {};
            acc[shareId][itemId] = item;
            return acc;
        }, {})
    );

export const withOptimisticItemsByShareId = withOptimistic<ItemsByShareId>(
    [
        {
            initiate: (action) => itemCreate.intent.match(action) && getItemEntityID(action.payload),
            fail: (action) => itemCreate.failure.match(action) && getItemEntityID(action.payload),
            revert: [(action) => itemCreate.success.match(action) && getItemEntityID(action.payload), itemCreateDismiss.optimisticMatch],
        },
        {
            initiate: (action) => itemEdit.intent.match(action) && getItemEntityID(action.payload),
            fail: (action) => itemEdit.failure.match(action) && getItemEntityID(action.payload),
            commit: (action) => itemEdit.success.match(action) && getItemEntityID(action.payload),
            revert: itemEditDismiss.optimisticMatch,
        },
    ],
    (state = {}, action: Action) => {
        if (bootSuccess.match(action) && action.payload?.items !== undefined) return action.payload.items;
        if (syncSuccess.match(action)) return action.payload.items;
        if (sharesEventNew.match(action)) return fullMerge(state, action.payload.items);

        if (itemCreate.intent.match(action)) {
            const { shareId, optimisticId, optimisticTime, files, ...item } = action.payload;
            const optimisticItem = state?.[shareId]?.[optimisticId];
            const now = optimisticTime ?? getEpoch();
            const flags = files.toAdd.length > 0 ? ItemFlag.HasAttachments : 0;

            /**
             * FIXME: we could rely on an optimistic revisionTime update
             * optimistically bump the revision number in the case of retries,
             * the correct revision number will be set on item creation success.
             * This allows this item to be correctly marked as failed.
             */
            return fullMerge(state, {
                [shareId]: {
                    [optimisticId]: {
                        aliasEmail: item.type === 'alias' ? item.extraData.aliasEmail : null,
                        contentFormatVersion: ContentFormatVersion.Item,
                        createTime: now,
                        data: item,
                        flags,
                        itemId: optimisticId,
                        lastUseTime: null,
                        modifyTime: now,
                        pinned: false,
                        revision: optimisticItem !== undefined ? optimisticItem.revision + 1 : 0,
                        revisionTime: now,
                        shareId: shareId,
                        state: ItemState.Active,
                        shareCount: 0,
                    },
                },
            });
        }

        if (itemCreate.success.match(action)) {
            const { shareId, item, alias } = action.payload;

            return fullMerge(state, {
                [shareId]: {
                    ...(alias ? { [alias.itemId]: alias } : {}),
                    [item.itemId]: item,
                },
            });
        }

        if (importItemsProgress.match(action)) {
            const { shareId, items } = action.payload;
            return fullMerge(state, { [shareId]: toMap(items, 'itemId') });
        }

        if (itemTrash.success.match(action)) {
            const { itemId, shareId } = action.payload;
            return updateItem({ shareId, itemId, state: ItemState.Trashed, modifyTime: getEpoch() })(state);
        }

        if (itemRestore.success.match(action)) {
            const { shareId, itemId } = action.payload;
            return updateItem({ shareId, itemId, state: ItemState.Active, modifyTime: getEpoch() })(state);
        }

        if (itemEdit.intent.match(action)) {
            const { shareId, itemId, lastRevision, files, ...item } = action.payload;
            const existing = state[shareId][itemId];

            /* Optimistically bump the revision number in the case of retries,
             * the correct revision number will be set on item edit success.
             * This allows this item to be correctly marked as failed.
             * Optimistically update the item attachment flags for UI purposes. */
            const revision = existing.revision + 1;
            const flags = files.toAdd.length ? existing.flags | ItemFlag.HasAttachments : existing.flags;

            return updateItem({ shareId, itemId, data: item, revision, flags })(state);
        }

        if (
            or(
                itemEdit.success.match,
                setItemFlags.success.match,
                aliasSyncStatusToggle.success.match,
                itemDeleteRevisions.success.match
            )(action)
        ) {
            const { shareId, itemId, item } = action.payload;
            return fullMerge(state, { [shareId]: { [itemId]: item } });
        }

        if (fileLinkPending.success.match(action)) return updateItem(action.payload.item)(state);

        if (itemsEditEvent.match(action)) {
            const { items } = action.payload;
            return addItems(items)(state);
        }

        if (itemsUsedEvent.match(action)) {
            const { items } = action.payload;
            return updateItems(items)(state);
        }

        if (itemDelete.success.match(action)) {
            const { shareId, itemId } = action.payload;
            return { ...state, [shareId]: objectDelete(state[shareId], itemId) };
        }

        if (itemsDeleteEvent.match(action)) {
            const { shareId } = action.payload;
            const itemIds = new Set(action.payload.itemIds);

            return { ...state, [shareId]: objectFilter(state[shareId], (itemId) => !itemIds.has(itemId)) };
        }

        if (itemMove.success.match(action)) {
            const { before, after } = action.payload;
            return fullMerge(
                { ...state, [before.shareId]: objectDelete(state[before.shareId], before.itemId) },
                { [after.shareId]: { [after.itemId]: after } }
            );
        }

        if (itemPinSuccess.match(action)) {
            const { shareId, itemId } = action.payload;
            return updateItem({ shareId, itemId, pinned: true })(state);
        }

        if (itemUnpinSuccess.match(action)) {
            const { shareId, itemId } = action.payload;
            return updateItem({ shareId, itemId, pinned: false })(state);
        }

        if (or(emptyTrashProgress.match, itemBulkDeleteProgress.match)(action)) {
            const deletedItemIds = action.payload.batch.map(prop('ItemID'));
            return objectMap(state, (shareId, items) =>
                shareId === action.payload.shareId ? objectFilter(items, notIn(deletedItemIds)) : items
            );
        }

        if (or(restoreTrashProgress.match, itemBulkRestoreProgress.match)(action)) {
            const { shareId, batch } = action.payload;

            return updateItems(
                batch.map<ItemRevisionUpdate>(({ ItemID: itemId }) => ({
                    shareId,
                    itemId,
                    state: ItemState.Active,
                    modifyTime: getEpoch(),
                }))
            )(state);
        }

        if (itemAutofilled.match(action)) {
            const { shareId, itemId } = action.payload;
            return updateItem({ shareId, itemId, lastUseTime: getEpoch() })(state);
        }

        if (or(vaultDeleteSuccess.match, shareEventDelete.match, shareLeaveSuccess.match)(action)) {
            return objectDelete(state, action.payload.shareId);
        }

        if (inviteAccept.success.match(action)) {
            const { share, items } = action.payload;
            return fullMerge(state, { [share.shareId]: toMap(items, 'itemId') });
        }

        if (or(itemBulkMoveProgress.match, vaultMoveAllItemsProgress.match)(action)) {
            const { shareId, batch, targetShareId, movedItems } = action.payload;

            /** Sanity check if the vault was deleted during an on-going process :
             * make sure source share and destination share both exist before merge */
            return fullMerge(
                {
                    ...state,
                    ...(shareId in state ? { [shareId]: objectFilter(state[shareId], notIn(batch.map(prop('itemId')))) } : {}),
                },
                { [targetShareId]: toMap(movedItems, 'itemId') }
            );
        }

        if (itemBulkTrashProgress.match(action)) {
            const { batch, shareId } = action.payload;

            return updateItems(
                batch.map<ItemRevisionUpdate>(({ ItemID: itemId }) => ({
                    shareId,
                    itemId,
                    state: ItemState.Trashed,
                    modifyTime: getEpoch(),
                }))
            )(state);
        }

        if (resolveAddressMonitor.success.match(action)) {
            const dto = action.payload;
            if (dto.type === AddressType.ALIAS) {
                const { shareId, itemId } = dto;
                return updateItem({ shareId, itemId, flags: 0 })(state);
            }
        }

        if (aliasSyncPending.success.match(action)) {
            const { items, shareId } = action.payload;
            return partialMerge(state, { [shareId]: toMap(items, 'itemId') });
        }

        return state;
    }
);

export type ItemsByOptimisticId = { [optimisticId: string]: UniqueItem };

const itemsByOptimisticId: Reducer<ItemsByOptimisticId> = (state = {}, action) => {
    if (itemCreate.success.match(action)) {
        const { optimisticId, item } = action.payload;
        const { itemId, shareId } = item;
        return fullMerge(state, { [optimisticId]: { shareId, itemId } });
    }

    return state;
};

/** revision number is stored on the `EditDraft` type in order
 * to future-proof drafts v2 : this will allow detecting stale
 * draft entries if an item was updated while having a draft. */
export type DraftBase = { mode: 'new'; type: ItemType } | { mode: 'edit'; itemId: string; shareId: string; revision: number };

export type Draft<V extends {} = any> = DraftBase & { formData: V };
export type EditDraft = Extract<Draft, { mode: 'edit' }>;
export type NewDraft = Extract<Draft, { mode: 'new' }>;

/** Draft state now supports pushing multiple entries so as to future-proof
 * drafts v2. In the extension, we are stil relying on a single active draft
 * and all drafts will be garbage collected on extension boot. This behaviour
 * does not make sense for the web-app and is unavailable for web. */
const draftsReducer: Reducer<Draft[]> = (state = [], action) => {
    /* Ensures only one new item draft exists and that we do not
     * have duplicates for item edit drafts */
    const sanitizeDrafts = (drafts: Draft[], draft: DraftBase) => {
        if (draft.mode === 'new') return drafts.filter(({ mode }) => mode !== 'new');
        else return drafts.filter((entry) => entry.mode === 'new' || !itemEq(draft)(entry));
    };

    if (draftSave.match(action)) return [action.payload, ...sanitizeDrafts(state, action.payload)];
    if (draftDiscard.match(action)) return sanitizeDrafts(state, action.payload);
    if (draftsGarbageCollect.match(action)) return [];

    return state;
};

export type SecureLinkState = IndexedByShareIdAndItemId<SecureLink[]>;

const removeSecureLinksForItems = (state: SecureLinkState, shareId: ShareId, itemIds: ItemId[]): SecureLinkState =>
    objectMap(state, (key, value) => (key === shareId ? objectFilter(value, notIn(itemIds)) : value));

const removeSecureLinksForShare = (state: SecureLinkState, shareId: ShareId) => objectFilter(state, not(eq(shareId)));

const secureLinksReducer: Reducer<SecureLinkState> = (state = {}, action) => {
    if (or(secureLinksGet.success.match, secureLinksRemoveInactive.success.match)(action)) {
        return action.payload.reduce<SecureLinkState>((acc, link) => {
            const { shareId, itemId } = link;
            const secureLink = acc[shareId]?.[itemId];

            if (!secureLink) acc[shareId] = { ...(acc[shareId] ?? {}), [itemId]: [link] };
            else secureLink.push(link);

            return acc;
        }, {});
    }

    if (secureLinkCreate.success.match(action)) {
        const secureLink = action.payload;
        const { shareId, itemId } = secureLink;
        const links = state?.[shareId]?.[itemId] ?? [];

        return partialMerge(state, { [shareId]: { [itemId]: links.concat(secureLink) } });
    }

    if (secureLinkRemove.success.match(action)) {
        const { shareId, itemId, linkId } = action.payload;
        const links = state[shareId][itemId].filter((link) => link.linkId !== linkId);

        return links.length === 0
            ? { ...state, [shareId]: objectDelete(state[shareId], itemId) }
            : partialMerge(state, { [shareId]: { [itemId]: links } });
    }

    /** NOTE: Optimistically remove secure-links invalidated by vault
     * or item operations: item moves/deletes and share deletes. */

    if (itemDelete.success.match(action)) {
        const { shareId, itemId } = action.payload;
        return removeSecureLinksForItems(state, shareId, [itemId]);
    }

    if (itemsDeleteEvent.match(action)) {
        const { shareId, itemIds } = action.payload;
        return removeSecureLinksForItems(state, shareId, itemIds);
    }

    if (itemMove.success.match(action)) {
        const { shareId, itemId } = action.payload.before;
        return removeSecureLinksForItems(state, shareId, [itemId]);
    }

    if (or(itemBulkMoveProgress.match, vaultMoveAllItemsProgress.match, itemBulkDeleteProgress.match)(action)) {
        const { shareId, batch } = action.payload;
        const itemIds = batch.map(prop('itemId'));
        return removeSecureLinksForItems(state, shareId, itemIds);
    }

    if (or(shareEventDelete.match, vaultDeleteSuccess.match)(action)) {
        return removeSecureLinksForShare(state, action.payload.shareId);
    }

    return state;
};

export type ItemsState = {
    byShareId: WrappedOptimisticState<ItemsByShareId>;
    byOptimisticId: ItemsByOptimisticId;
    drafts: Draft[];
};

export default combineOptimisticReducers({
    byShareId: withOptimisticItemsByShareId.reducer,
    byOptimisticId: itemsByOptimisticId,
    drafts: draftsReducer,
    secureLinks: secureLinksReducer,
});
