import type { Action, Reducer } from 'redux';

import {
    bootSuccess,
    inviteAccept,
    shareEvent,
    shareEventDelete,
    shareEventUpdate,
    shareLeaveSuccess,
    sharesEventNew,
    sharesEventSync,
    sharesHide,
    syncSuccess,
    vaultCreationSuccess,
    vaultDeleteSuccess,
    vaultEditSuccess,
} from '@proton/pass/store/actions';
import type { Share, ShareId } from '@proton/pass/types';
import { type ShareType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { fullMerge, partialMerge } from '@proton/pass/utils/object/merge';

export type ShareItem<T extends ShareType = ShareType> = Share<T>;

export type WithItemCount<T> = T & { count: number };
export type VaultShareItem = ShareItem<ShareType.Vault>;
export type SharesState = Record<ShareId, ShareItem>;

export const shares: Reducer<SharesState> = (state = {}, action: Action) => {
    if (bootSuccess.match(action) && action.payload?.shares !== undefined) return action.payload.shares;
    if (syncSuccess.match(action)) return action.payload.shares;
    if (sharesEventNew.match(action)) return fullMerge(state, action.payload.shares);

    if (shareEvent.match(action) && state !== null) {
        const { shareId, Events } = action.payload;
        const currentEventId = state[shareId].eventId;

        return Events.LatestEventID === currentEventId
            ? state
            : partialMerge(state, { [action.payload.shareId]: { eventId: action.payload.Events.LatestEventID } });
    }

    if (vaultCreationSuccess.match(action)) {
        const { share } = action.payload;
        return fullMerge(state, { [share.shareId]: share });
    }

    if (vaultEditSuccess.match(action)) {
        const { share } = action.payload;
        return partialMerge(state, { [share.shareId]: share });
    }

    if (sharesHide.success.match(action)) {
        const { shares } = action.payload;
        return fullMerge(state, shares);
    }

    if (shareEventUpdate.match(action)) {
        const share = action.payload;
        return fullMerge(state, { [share.shareId]: share });
    }

    if (or(vaultDeleteSuccess.match, shareEventDelete.match, shareLeaveSuccess.match)(action)) {
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
