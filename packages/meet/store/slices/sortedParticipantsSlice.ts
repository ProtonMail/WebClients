import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import shallowEqual from '@proton/utils/shallowEqual';

import { PAGE_SIZE } from '../../constants';
import { getIdealSortedParticipants } from '../../utils/participants/getIdealSortedParticipants';
import { getVisuallyStableSortedParticipants } from '../../utils/participants/getVisuallyStableSortedParticipants';
import type { MeetState } from '../rootReducer';
import { selectSelfView } from './settings';
import { selectParticipantsMap } from './meetingInfo';

export interface SortedParticipantsState {
    localParticipantIdentity: string;
    sortedParticipantIdentities: string[];
    page: number;
    pageSize: number;
    localParticipantColorIndex: number;
}

export const initialState: SortedParticipantsState = {
    localParticipantIdentity: '',
    sortedParticipantIdentities: [],
    page: 0,
    pageSize: PAGE_SIZE,
    localParticipantColorIndex: 0,
};

const calculateTotalPageCount = ({
    identities,
    pageSize,
    selfView,
}: {
    identities: string[];
    pageSize: number;
    selfView: boolean;
}) => {
    if (selfView) {
        return Math.ceil(identities.length / pageSize);
    } else {
        // Remove local participant from count when selfView is disabled
        return Math.max(1, Math.ceil((identities.length - 1) / pageSize));
    }
};

const slice = createSlice({
    name: 'sortedParticipants',
    initialState,
    reducers: {
        setSortedParticipantIdentities: (state, action: PayloadAction<string[]>) => {
            // Only update if participants actually changed
            if (
                action.payload.length === state.sortedParticipantIdentities.length &&
                action.payload.every((id, index) => id === state.sortedParticipantIdentities[index])
            ) {
                return;
            }

            state.sortedParticipantIdentities = action.payload;
        },
        resetSortedParticipants: (state) => {
            state.sortedParticipantIdentities = initialState.sortedParticipantIdentities;
            state.page = initialState.page;
            state.pageSize = initialState.pageSize;
        },
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload;
        },
        setPageSize: (state, action: PayloadAction<number>) => {
            state.pageSize = action.payload;
        },
        setLocalParticipantColorIndex: (state, action: PayloadAction<number>) => {
            state.localParticipantColorIndex = action.payload;
        },
        setLocalParticipantIdentity: (state, action: PayloadAction<string>) => {
            state.localParticipantIdentity = action.payload;
        },
        // Used in combination of removeParticipant thunk
        _removeParticipant: (state, action: PayloadAction<{ participantIdentity: string; lastPage: number }>) => {
            const { participantIdentity, lastPage } = action.payload;

            state.sortedParticipantIdentities = state.sortedParticipantIdentities.filter(
                (id) => id !== participantIdentity
            );

            if (state.page > lastPage) {
                state.page = lastPage;
            }
        },
    },
});

export const removeParticipant =
    (participantIdentity: string): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> =>
    (dispatch, getState) => {
        const { sortedParticipantIdentities, pageSize } = getState().sortedParticipants;
        const { selfView } = getState().meetSettings;

        const remainingIdentities = sortedParticipantIdentities.filter((id) => id !== participantIdentity);

        // Recalculate last page after removing a participant
        const totalPageCount = calculateTotalPageCount({
            identities: remainingIdentities,
            pageSize,
            selfView,
        });
        const lastPage = Math.max(0, totalPageCount - 1);

        dispatch(slice.actions._removeParticipant({ participantIdentity, lastPage }));
    };

export const updateSortedParticipants =
    (
        participants: (LocalParticipant | RemoteParticipant)[]
    ): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> =>
    (dispatch, getState) => {
        const { raisedHands } = getState().meetingChatAndReactions;
        // Get raised hands and remove local participant and the ones are not in the participants list
        const raisedHandsSet = new Set(
            raisedHands.filter((id) => participants.some((p) => p.identity === id && !p.isLocal))
        );

        // Get the ideal order of participants
        const idealOrder = getIdealSortedParticipants({ participants, raisedHandsSet });

        if (idealOrder.length === 0) {
            return;
        }

        const { sortedParticipantIdentities, pageSize } = getState().sortedParticipants;
        const { selfView } = getState().meetSettings;

        // Calculate the stable order of participants using old order and ideal order
        const stableOrder = getVisuallyStableSortedParticipants({
            idealOrder,
            previousOrder: sortedParticipantIdentities,
            pageSize,
            selfView,
        });

        // Move raised hands first after local participant
        const stableOrderWithRaisedHandsFirst = [
            // Local participant is always first
            stableOrder[0],
            ...raisedHandsSet,
            ...stableOrder.slice(1).filter((id) => !raisedHandsSet.has(id)),
        ];

        dispatch(slice.actions.setSortedParticipantIdentities(stableOrderWithRaisedHandsFirst));
    };

export const selectSortedParticipantIdentities = (state: MeetState) => {
    return state.sortedParticipants.sortedParticipantIdentities;
};

export const selectTotalParticipantCount = (state: MeetState) => {
    return state.sortedParticipants.sortedParticipantIdentities.length;
};

export const selectPage = (state: MeetState) => {
    return state.sortedParticipants.page;
};

export const selectPageSize = (state: MeetState) => {
    return state.sortedParticipants.pageSize;
};

export const selectPagedIdentities = createSelector(
    [selectSortedParticipantIdentities, selectPage, selectPageSize, selectSelfView],
    (identities, page, pageSize, selfView) => {
        // Don't hide self view when there is only one participant
        if (identities.length <= 1) {
            return identities;
        }

        const start = page * pageSize + (selfView ? 0 : 1);

        return identities.slice(start, start + pageSize);
    },
    // We apply a shallow equality to avoid unnecessary re-renders
    // Because even that actual page is stable, changes to other pages would trigger
    // selectSortedParticipantIdentities and will create a new array reference
    { memoizeOptions: { resultEqualityCheck: shallowEqual } }
);

export const selectPageCount = createSelector(
    [selectSortedParticipantIdentities, selectPageSize, selectSelfView],
    (identities, pageSize, selfView) => calculateTotalPageCount({ identities, pageSize, selfView })
);

export const selectLocalParticipantColorIndex = (state: MeetState) => {
    return state.sortedParticipants.localParticipantColorIndex;
};

export const selectLocalParticipantIdentity = (state: MeetState) => {
    return state.sortedParticipants.localParticipantIdentity;
};

export const selectIsLocalParticipantAdminOrHost = createSelector([
    selectParticipantsMap,
    selectLocalParticipantIdentity,
], (participantsMap, localParticipantIdentity) => {
    const participant = participantsMap[localParticipantIdentity];
    return !!participant?.IsAdmin || !!participant?.IsHost;
});

export const {
    setSortedParticipantIdentities,
    resetSortedParticipants,
    setPage,
    setPageSize,
    setLocalParticipantColorIndex,
    setLocalParticipantIdentity,
} = slice.actions;

export const sortedParticipantsReducer = { sortedParticipants: slice.reducer };
