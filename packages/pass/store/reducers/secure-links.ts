/** combined in main items reducer: `./items.ts` */
import type { Reducer } from 'redux';

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
    shareEventDelete,
    vaultDeleteSuccess,
    vaultMoveAllItemsProgress,
} from '@proton/pass/store/actions';
import type { IndexedByShareIdAndItemId, ItemId, SecureLink, ShareId } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { eq, not, notIn, or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { objectMap } from '@proton/pass/utils/object/map';
import { partialMerge } from '@proton/pass/utils/object/merge';

export type SecureLinkState = IndexedByShareIdAndItemId<SecureLink[]>;

const removeSecureLinksForItems = (state: SecureLinkState, shareId: ShareId, itemIds: ItemId[]): SecureLinkState =>
    objectMap(state, (key, value) => (key === shareId ? objectFilter(value, notIn(itemIds)) : value));

const removeSecureLinksForShare = (state: SecureLinkState, shareId: ShareId) => objectFilter(state, not(eq(shareId)));

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

    if (or(shareEventDelete.match, vaultDeleteSuccess.match)(action)) {
        return removeSecureLinksForShare(state, action.payload.shareId);
    }

    return state;
};
