import type { AnyAction, Reducer } from 'redux';

import { CONTENT_FORMAT_VERSION, type ItemRevision, ItemState, type UniqueItem } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp';
import { fullMerge, objectDelete, partialMerge } from '@proton/pass/utils/object';
import { isTrashed } from '@proton/pass/utils/pass/trash';
import { getEpoch } from '@proton/pass/utils/time';
import { toMap } from '@proton/shared/lib/helpers/object';

import {
    bootSuccess,
    emptyTrashFailure,
    emptyTrashIntent,
    emptyTrashSuccess,
    itemAutofillIntent,
    itemCreationDismiss,
    itemCreationFailure,
    itemCreationIntent,
    itemCreationSuccess,
    itemDeleteFailure,
    itemDeleteIntent,
    itemDeleteSuccess,
    itemDeleteSync,
    itemEditDismiss,
    itemEditFailure,
    itemEditIntent,
    itemEditSuccess,
    itemEditSync,
    itemLastUseTimeUpdated,
    itemMoveFailure,
    itemMoveIntent,
    itemMoveSuccess,
    itemRestoreFailure,
    itemRestoreIntent,
    itemRestoreSuccess,
    itemTrashFailure,
    itemTrashIntent,
    itemTrashSuccess,
    itemsBatchImported,
    itemsRequestSuccess,
    restoreTrashFailure,
    restoreTrashIntent,
    restoreTrashSuccess,
    shareDeleteSync,
    sharesSync,
    syncSuccess,
    vaultDeleteIntent,
    vaultDeleteSuccess,
} from '../actions';
import { sanitizeWithCallbackAction } from '../actions/with-callback';
import type { WrappedOptimisticState } from '../optimistic/types';
import { combineOptimisticReducers } from '../optimistic/utils/combine-optimistic-reducers';
import withOptimistic from '../optimistic/with-optimistic';

/*
 * itemIds are only guaranteed to be unique per share
 * not globally, therefore it must be nested like this
 */
export type ItemsByShareId = {
    [shareId: string]: {
        [itemId: string]: ItemRevision;
    };
};

type ItemsByOptimisticId = { [optimisticId: string]: UniqueItem };

export type ItemsState = {
    byShareId: WrappedOptimisticState<ItemsByShareId>;
    byOptimistcId: ItemsByOptimisticId;
};

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
        {
            initiate: restoreTrashIntent.match,
            commit: restoreTrashSuccess.match,
            revert: restoreTrashFailure.match,
        },
        {
            initiate: emptyTrashIntent.match,
            commit: emptyTrashSuccess.match,
            revert: emptyTrashFailure.match,
        },
    ],
    (state = {}, action: AnyAction) => {
        if (bootSuccess.match(action) && action.payload.sync?.items !== undefined) {
            return action.payload.sync.items;
        }

        if (syncSuccess.match(action)) {
            return action.payload.items;
        }

        if (sharesSync.match(action)) {
            return fullMerge(state, action.payload.items);
        }

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
                        itemId: optimisticId,
                        shareId: shareId,
                        revision: optimisticItem !== undefined ? optimisticItem.revision + 1 : 0,
                        data: item,
                        aliasEmail: item.type === 'alias' ? item.extraData.aliasEmail : null,
                        state: ItemState.Active,
                        createTime,
                        modifyTime: createTime,
                        revisionTime: createTime,
                        lastUseTime: null,
                        contentFormatVersion: CONTENT_FORMAT_VERSION,
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

        if (itemsBatchImported.match(action)) {
            const { shareId, items } = action.payload;
            return fullMerge(state, { [shareId]: toMap(items, 'itemId') });
        }

        if (itemTrashIntent.match(action)) {
            const {
                item: { itemId },
                shareId,
            } = action.payload;

            return partialMerge(state, { [shareId]: { [itemId]: { state: ItemState.Trashed } } });
        }

        if (itemRestoreIntent.match(action)) {
            const {
                item: { itemId },
                shareId,
            } = action.payload;

            return partialMerge(state, { [shareId]: { [itemId]: { state: ItemState.Active } } });
        }

        if (itemEditIntent.match(action)) {
            const { shareId, itemId, ...item } = action.payload;
            const { revision } = state[shareId][itemId];

            /**
             * FIXME: see `itemCreationIntent.match`
             * optimistically bump the revision number in the case of retries,
             * the correct revision number will be set on item edit success.
             * This allows this item to be correctly marked as failed.
             */
            return partialMerge(state, {
                [shareId]: { [itemId]: { data: item, revision: revision + 1 } },
            });
        }

        if (itemEditSuccess.match(action) || itemEditSync.match(action)) {
            const { shareId, item } = action.payload;
            const { itemId } = item;

            return fullMerge(state, { [shareId]: { [itemId]: item } });
        }

        if (itemLastUseTimeUpdated.match(action)) {
            const { shareId, itemId, lastUseTime } = action.payload;

            return partialMerge(state, { [shareId]: { [itemId]: { lastUseTime } } });
        }

        if (itemDeleteIntent.match(action)) {
            const { shareId, item } = action.payload;

            return { ...state, [shareId]: objectDelete(state[shareId], item.itemId) };
        }

        if (itemDeleteSync.match(action)) {
            const { shareId, itemId } = action.payload;

            return { ...state, [shareId]: objectDelete(state[shareId], itemId) };
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

        if (emptyTrashIntent.match(action)) {
            return Object.fromEntries(
                Object.entries(state).map(([shareId, itemsById]) => [
                    shareId,
                    Object.entries(itemsById).reduce(
                        (reduction, [itemId, item]) =>
                            isTrashed(item) ? reduction : fullMerge(reduction, { [itemId]: item }),
                        {}
                    ),
                ])
            );
        }

        if (restoreTrashIntent.match(action)) {
            return Object.fromEntries(
                Object.entries(state).map(([shareId, itemsById]) => [
                    shareId,
                    Object.fromEntries(
                        Object.entries(itemsById).map(([itemId, item]) => [
                            itemId,
                            isTrashed(item) ? partialMerge(item, { state: ItemState.Active }) : item,
                        ])
                    ),
                ])
            );
        }

        if (itemsRequestSuccess.match(action)) {
            const {
                payload: { shareId, items },
            } = action;

            const itemsById = items.reduce((reduction, item) => ({ ...reduction, [item.itemId]: item }), {});

            return fullMerge(state, { [shareId]: itemsById });
        }

        if (itemAutofillIntent.match(action)) {
            const {
                payload: { shareId, itemId },
            } = action;

            return partialMerge(state, { [shareId]: { [itemId]: { lastUseTime: getEpoch() } } });
        }

        if (vaultDeleteIntent.match(action)) {
            return objectDelete(state, action.payload.id);
        }

        if (vaultDeleteSuccess.match(action)) {
            const movedItems = action.payload.movedItems;
            const nextState = objectDelete(state, action.payload.id);

            return movedItems.length > 0
                ? fullMerge(nextState, { [movedItems[0].shareId]: toMap(movedItems, 'itemId') })
                : nextState;
        }

        if (shareDeleteSync.match(action)) {
            return objectDelete(state, action.payload.shareId);
        }

        return state;
    },
    { sanitizeAction: sanitizeWithCallbackAction }
);

const itemsByOptimisticId: Reducer<ItemsByOptimisticId> = (state = {}, action) => {
    if (or(itemCreationSuccess.match, itemMoveSuccess.match, itemMoveFailure.match)(action)) {
        const { optimisticId, item } = action.payload;
        const { itemId, shareId } = item;

        return fullMerge(state, { [optimisticId]: { shareId, itemId } });
    }

    return state;
};

export default combineOptimisticReducers({
    byShareId: withOptimisticItemsByShareId.reducer,
    byOptimistcId: itemsByOptimisticId,
});
