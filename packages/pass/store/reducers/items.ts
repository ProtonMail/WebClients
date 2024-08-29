import type { Action, Reducer } from 'redux';

import { itemEq } from '@proton/pass/lib/items/item.predicates';
import { AddressType } from '@proton/pass/lib/monitor/types';
import {
    aliasSyncPending,
    aliasToggleStatus,
    bootSuccess,
    draftDiscard,
    draftSave,
    draftsGarbageCollect,
    emptyTrashProgress,
    importItemsProgress,
    inviteAcceptSuccess,
    itemAutofilled,
    itemBulkDeleteProgress,
    itemBulkMoveProgress,
    itemBulkRestoreProgress,
    itemBulkTrashProgress,
    itemCreationDismiss,
    itemCreationFailure,
    itemCreationIntent,
    itemCreationSuccess,
    itemDeleteFailure,
    itemDeleteIntent,
    itemDeleteSuccess,
    itemEditDismiss,
    itemEditFailure,
    itemEditIntent,
    itemEditSuccess,
    itemMoveFailure,
    itemMoveIntent,
    itemMoveSuccess,
    itemPinSuccess,
    itemRestoreFailure,
    itemRestoreIntent,
    itemRestoreSuccess,
    itemTrashFailure,
    itemTrashIntent,
    itemTrashSuccess,
    itemUnpinSuccess,
    itemsDeleteSync,
    itemsEditSync,
    itemsUsedSync,
    resolveAddressMonitor,
    restoreTrashProgress,
    secureLinkCreate,
    secureLinkRemove,
    secureLinksGet,
    secureLinksRemoveInactive,
    setItemFlags,
    shareDeleteSync,
    shareLeaveSuccess,
    sharedVaultCreated,
    sharesSync,
    syncSuccess,
    vaultDeleteSuccess,
    vaultMoveAllItemsProgress,
} from '@proton/pass/store/actions';
import { sanitizeWithCallbackAction } from '@proton/pass/store/actions/enhancers/callback';
import type { WrappedOptimisticState } from '@proton/pass/store/optimistic/types';
import { combineOptimisticReducers } from '@proton/pass/store/optimistic/utils/combine-optimistic-reducers';
import withOptimistic from '@proton/pass/store/optimistic/with-optimistic';
import {
    ContentFormatVersion,
    type IndexedByShareIdAndItemId,
    type ItemRevision,
    ItemState,
    type ItemType,
    type RequiredProps,
    type SecureLink,
    type UniqueItem,
} from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { notIn, or } from '@proton/pass/utils/fp/predicates';
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
            initiate: itemCreationIntent.optimisticMatch,
            fail: itemCreationFailure.optimisticMatch,
            revert: [itemCreationSuccess.optimisticMatch, itemCreationDismiss.optimisticMatch],
        },
        {
            initiate: itemEditIntent.optimisticMatch,
            fail: itemEditFailure.optimisticMatch,
            commit: itemEditSuccess.optimisticMatch,
            revert: itemEditDismiss.optimisticMatch,
        },
        {
            initiate: itemMoveIntent.optimisticMatch,
            commit: itemMoveSuccess.optimisticMatch,
            revert: itemMoveFailure.optimisticMatch,
        },
        {
            initiate: itemTrashIntent.optimisticMatch,
            commit: itemTrashSuccess.optimisticMatch,
            revert: itemTrashFailure.optimisticMatch,
        },
        {
            initiate: itemRestoreIntent.optimisticMatch,
            commit: itemRestoreSuccess.optimisticMatch,
            revert: itemRestoreFailure.optimisticMatch,
        },
        {
            initiate: itemDeleteIntent.optimisticMatch,
            commit: itemDeleteSuccess.optimisticMatch,
            revert: itemDeleteFailure.optimisticMatch,
        },
    ],
    (state = {}, action: Action) => {
        if (bootSuccess.match(action) && action.payload?.items !== undefined) return action.payload.items;
        if (syncSuccess.match(action)) return action.payload.items;
        if (sharesSync.match(action)) return fullMerge(state, action.payload.items);

        if (itemCreationIntent.match(action)) {
            const { shareId, optimisticId, createTime, ...item } = action.payload;
            const optimisticItem = state?.[shareId]?.[optimisticId];

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
                        createTime,
                        data: item,
                        flags: 1 /** default to unmonitored */,
                        itemId: optimisticId,
                        lastUseTime: null,
                        modifyTime: createTime,
                        pinned: false,
                        revision: optimisticItem !== undefined ? optimisticItem.revision + 1 : 0,
                        revisionTime: createTime,
                        shareId: shareId,
                        state: ItemState.Active,
                    },
                },
            });
        }

        if (itemCreationSuccess.match(action)) {
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

        if (itemTrashIntent.match(action)) {
            const { item, shareId } = action.payload;
            const { itemId } = item;

            return updateItem({ shareId, itemId, state: ItemState.Trashed })(state);
        }

        if (itemRestoreIntent.match(action)) {
            const { item, shareId } = action.payload;
            const { itemId } = item;

            return updateItem({ shareId, itemId, state: ItemState.Active })(state);
        }

        if (itemEditIntent.match(action)) {
            const { shareId, itemId, ...item } = action.payload;
            const { revision } = state[shareId][itemId];

            /* FIXME: see `itemCreationIntent.match`
             * optimistically bump the revision number in the case of retries,
             * the correct revision number will be set on item edit success.
             * This allows this item to be correctly marked as failed */
            return updateItem({ shareId, itemId, data: item, revision: revision + 1 })(state);
        }

        if (or(itemEditSuccess.match, setItemFlags.success.match, aliasToggleStatus.success.match)(action)) {
            const { shareId, itemId, item } = action.payload;
            return fullMerge(state, { [shareId]: { [itemId]: item } });
        }

        if (itemsEditSync.match(action)) {
            const { items } = action.payload;
            return addItems(items)(state);
        }

        if (itemsUsedSync.match(action)) {
            const { items } = action.payload;
            return updateItems(items)(state);
        }

        if (itemDeleteIntent.match(action)) {
            const { shareId, item } = action.payload;
            return { ...state, [shareId]: objectDelete(state[shareId], item.itemId) };
        }

        if (itemsDeleteSync.match(action)) {
            const { shareId } = action.payload;
            const itemIds = new Set(action.payload.itemIds);

            return { ...state, [shareId]: objectFilter(state[shareId], (itemId) => !itemIds.has(itemId)) };
        }

        /**
         * BE side and under the hood, moving an item
         * will delete the item and re-create a new one.
         * That's why we are relying on an optimisticId
         * on an `itemMoveIntent`. This is similar to
         * the `itemCreationIntent` flow with the extra
         * deletion of the item to be moved.
         */
        if (itemMoveIntent.match(action)) {
            const { item, optimisticId, shareId } = action.payload;
            return fullMerge(
                { ...state, [item.shareId]: objectDelete(state[item.shareId], item.itemId) },
                {
                    [shareId]: {
                        [optimisticId]: {
                            ...item,
                            shareId,
                            itemId: optimisticId,
                            modifyTime: getEpoch(),
                        },
                    },
                }
            );
        }

        if (itemMoveSuccess.match(action)) {
            const { item, shareId, optimisticId } = action.payload;
            return fullMerge(
                { ...state, [shareId]: objectDelete(state[item.shareId], optimisticId) },
                { [shareId]: { [item.itemId]: item } }
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

        if (sharedVaultCreated.match(action) && action.payload.move) {
            const { shareId } = action.payload.share;
            const { before, after } = action.payload.move;

            return fullMerge(
                { ...state, [before.shareId]: objectDelete(state[before.shareId], before.itemId) },
                { [shareId]: { [after.itemId]: after } }
            );
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
                }))
            )(state);
        }

        if (itemAutofilled.match(action)) {
            const { shareId, itemId } = action.payload;
            return updateItem({ shareId, itemId, lastUseTime: getEpoch() })(state);
        }

        if (or(vaultDeleteSuccess.match, shareDeleteSync.match, shareLeaveSuccess.match)(action)) {
            return objectDelete(state, action.payload.shareId);
        }

        if (inviteAcceptSuccess.match(action)) {
            return fullMerge(state, { [action.payload.share.shareId]: toMap(action.payload.items, 'itemId') });
        }

        if (or(itemBulkMoveProgress.match, vaultMoveAllItemsProgress.match)(action)) {
            const { shareId, batch, destinationShareId, movedItems } = action.payload;
            return fullMerge(
                { ...state, [shareId]: objectFilter(state[shareId], notIn(batch.map(prop('itemId')))) },
                { [destinationShareId]: toMap(movedItems, 'itemId') }
            );
        }

        if (itemBulkTrashProgress.match(action)) {
            const { batch, shareId } = action.payload;

            return updateItems(
                batch.map<ItemRevisionUpdate>(({ ItemID: itemId }) => ({
                    shareId,
                    itemId,
                    state: ItemState.Trashed,
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
    },
    { sanitizeAction: sanitizeWithCallbackAction }
);

export type ItemsByOptimisticId = { [optimisticId: string]: UniqueItem };

const itemsByOptimisticId: Reducer<ItemsByOptimisticId> = (state = {}, action) => {
    if (or(itemCreationSuccess.match, itemMoveSuccess.match, itemMoveFailure.match)(action)) {
        const { optimisticId, item } = action.payload;
        const { itemId, shareId } = item;

        return fullMerge(state, { [optimisticId]: { shareId, itemId } });
    }

    return state;
};

/** revision number is stored on the `EditDraft` type in order
 * to future-proof drafts v2 : this will allow detecting stale
 * draft entries if an item was updated while having a draft. */
export type DraftBase =
    | { mode: 'new'; type: ItemType }
    | { mode: 'edit'; itemId: string; shareId: string; revision: number };

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

const secureLinksReducer: Reducer<IndexedByShareIdAndItemId<SecureLink[]>> = (state = {}, action) => {
    if (or(secureLinksGet.success.match, secureLinksRemoveInactive.success.match)(action)) {
        return action.payload.reduce<IndexedByShareIdAndItemId<SecureLink[]>>((acc, link) => {
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

        return partialMerge(state, { [shareId]: { [itemId]: links } });
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
