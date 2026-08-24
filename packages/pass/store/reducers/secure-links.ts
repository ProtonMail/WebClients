/** combined in main items reducer: `./items.ts` */
import type { Reducer } from 'redux';

import type { IndexedByShareIdAndItemId, ItemId, SecureLink, ShareId } from '../../types';
import { prop } from '../../utils/fp/lens';
import { eq, not, notIn, or } from '../../utils/fp/predicates';
import { objectDelete } from '../../utils/object/delete';
import { objectFilter } from '../../utils/object/filter';
import { objectMap } from '../../utils/object/map';
import { partialMerge } from '../../utils/object/merge';
import {
    itemBulkDeleteProgress,
    itemBulkMoveProgress,
    itemDelete,
    itemMove,
    itemsDeleteEvent,
    secureLinkCreate,
    secureLinkRemove,
    secureLinksGet,
    secureLinksRemoveInactive,
    shareDeleted,
    vaultDeleteSuccess,
    vaultMoveAllItemsProgress,
} from '../actions';

export type SecureLinkState = IndexedByShareIdAndItemId<SecureLink[]>;

export const removeSecureLinksForItems = (state: SecureLinkState, shareId: ShareId, itemIds: ItemId[]): SecureLinkState =>
    objectMap(state, (key, value) => (key === shareId ? objectFilter(value, notIn(itemIds)) : value));

export const removeSecureLinksForShare = (state: SecureLinkState, shareId: ShareId) => objectFilter(state, not(eq(shareId)));

export const secureLinksReducer: Reducer<SecureLinkState> = (state = {}, action) => {
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

    if (or(shareDeleted.match, vaultDeleteSuccess.match)(action)) {
        return removeSecureLinksForShare(state, action.payload.shareId);
    }

    return state;
};
