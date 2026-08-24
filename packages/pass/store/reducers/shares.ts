import type { Action, Reducer } from 'redux';

import type { Share, ShareId, ShareType } from '../../types';
import { or } from '../../utils/fp/predicates';
import { objectDelete } from '../../utils/object/delete';
import { fullMerge, partialMerge } from '../../utils/object/merge';
import {
    inviteAccept,
    matchSyncAction,
    shareCreated,
    shareDeleted,
    shareEvent,
    shareEventUpdate,
    shareLeaveSuccess,
    shareUpdated,
    sharesEventNew,
    sharesEventSync,
    sharesVisibilityEdit,
    vaultCreationSuccess,
    vaultDeleteSuccess,
    vaultEditSuccess,
} from '../actions';

export type ShareItem<T extends ShareType = ShareType> = Share<T>;

export type WithItemCount<T> = T & { count: number };
export type VaultShareItem = ShareItem<ShareType.Vault>;
export type SharesState = Record<ShareId, ShareItem>;

export const shares: Reducer<SharesState> = (state = {}, action: Action) => {
    if (matchSyncAction(action) && action.payload?.shares) return action.payload.shares;
    if (sharesEventNew.match(action)) return fullMerge(state, action.payload.shares);

    if (shareEvent.match(action) && state !== null) {
        const { shareId, Events } = action.payload;
        const share = state[shareId];
        if (!share) return state;

        return Events.LatestEventID === share?.eventId
            ? state
            : partialMerge(state, { [action.payload.shareId]: { eventId: Events.LatestEventID } });
    }

    if (shareCreated.match(action)) {
        const { share } = action.payload;
        /** Wipe any existing entry before merging to avoid stale
         * properties surviving a recursive `fullMerge` (e.g. when
         * CS restores a previously deleted share). */
        return fullMerge(objectDelete(state, share.shareId), { [share.shareId]: share });
    }

    if (shareUpdated.match(action)) {
        const share = action.payload;
        return fullMerge(state, { [share.shareId]: share });
    }

    if (shareDeleted.match(action)) return objectDelete(state, action.payload.shareId);

    if (vaultCreationSuccess.match(action)) {
        const { share } = action.payload;
        return fullMerge(state, { [share.shareId]: share });
    }

    if (vaultEditSuccess.match(action)) {
        const { share } = action.payload;
        return partialMerge(state, { [share.shareId]: share });
    }

    if (sharesVisibilityEdit.success.match(action)) {
        return fullMerge(state, action.payload);
    }

    if (shareEventUpdate.match(action)) {
        const share = action.payload;
        return fullMerge(state, { [share.shareId]: share });
    }

    if (or(vaultDeleteSuccess.match, shareLeaveSuccess.match)(action)) {
        return objectDelete(state, action.payload.shareId);
    }

    if (sharesEventSync.match(action)) {
        const { shareId, ...data } = action.payload;
        return partialMerge(state, { [shareId]: data });
    }

    if (inviteAccept.success.match(action)) {
        const { share } = action.payload;
        return partialMerge(state, { [share.shareId]: share });
    }

    return state;
};

export default shares;
