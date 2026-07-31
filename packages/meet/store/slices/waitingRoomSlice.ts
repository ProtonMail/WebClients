import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { SECOND } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { MeetState } from '../rootReducer';
import { selectCanManageWaitingRoom } from './meetingInfo';
import { selectParticipantDecryptedNameMap } from './participants/participantsSlice';
import { selectWaitingRoomSetting } from './settings';

export type WaitingRoomJoinRequest = {
    requestId: string;
    participantUid: string;
    // Expires at in milliseconds
    expiresAt: number;
    // Received at in milliseconds
    receivedAt: number;
};

/**
 * The guest's position in the pre-join admission flow.
 * - `inactive`       — not in the waiting room (show the join form)
 * - `hostNotStarted` — host hasn't opened the meeting yet (polling)
 * - `awaiting`       — join request sent, waiting for the host to admit (countdown running)
 * - `expired`        — the request timed out without an answer
 * - `rejected`       — the host declined the request
 * - `admitted`       — Welcome received, the guest can proceed to join
 */
export enum WaitingRoomAdmissionStatus {
    INACTIVE = 'inactive',
    HOST_NOT_STARTED = 'hostNotStarted',
    AWAITING = 'awaiting',
    EXPIRED = 'expired',
    REJECTED = 'rejected',
    ADMITTED = 'admitted',
}

export const ADMISSION_TIMEOUT_S = 300;

export type WaitingRoomState = {
    waitingParticipants: WaitingRoomJoinRequest[];
    admissionStatus: WaitingRoomAdmissionStatus;
    admissionCountdown: number;
    admissionExpiresAt: number | null;
    admissionTimer: number | null;
};

export const initialState: WaitingRoomState = {
    waitingParticipants: [],
    admissionStatus: WaitingRoomAdmissionStatus.INACTIVE,
    admissionCountdown: ADMISSION_TIMEOUT_S,
    admissionExpiresAt: null,
    admissionTimer: null,
};

const slice = createSlice({
    name: 'waitingRoom',
    initialState,
    reducers: {
        addWaitingParticipant: (state, action: PayloadAction<WaitingRoomJoinRequest>) => {
            if (state.waitingParticipants.some((request) => request.requestId === action.payload.requestId)) {
                return;
            }

            state.waitingParticipants.push(action.payload);
        },
        removeWaitingParticipant: (state, action: PayloadAction<string>) => {
            state.waitingParticipants = state.waitingParticipants.filter(
                (request) => request.requestId !== action.payload
            );
        },
        removeWaitingParticipants: (state, action: PayloadAction<string[]>) => {
            const removedRequestIds = new Set(action.payload);
            state.waitingParticipants = state.waitingParticipants.filter(
                ({ requestId }) => !removedRequestIds.has(requestId)
            );
        },
        pruneExpiredWaitingParticipants: (state, action: PayloadAction<number>) => {
            const active = state.waitingParticipants.filter((request) => request.expiresAt > action.payload);
            if (active.length !== state.waitingParticipants.length) {
                state.waitingParticipants = active;
            }
        },
        setAdmissionStatus: (state, action: PayloadAction<WaitingRoomAdmissionStatus>) => {
            state.admissionStatus = action.payload;
        },
        setAdmissionCountdown: (state, action: PayloadAction<number>) => {
            state.admissionCountdown = action.payload;
        },
        setAdmissionExpiresAt: (state, action: PayloadAction<number | null>) => {
            state.admissionExpiresAt = action.payload;
        },
        setAdmissionTimer: (state, action: PayloadAction<number | null>) => {
            state.admissionTimer = action.payload;
        },
        // Internal: use the `resetWaitingRoom` thunk.
        _resetWaitingRoom: () => initialState,
    },
});

export const stopWaitingRoomAdmissionTimer =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        const { admissionTimer } = getState().waitingRoom;

        if (admissionTimer) {
            clearInterval(admissionTimer);
        }

        dispatch(slice.actions.setAdmissionTimer(null));
    };

/**
 * Recomputes the remaining time from the absolute deadline each tick, so it stays correct when a
 * background tab throttles setInterval.
 */
export const startWaitingRoomAdmissionTimer =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        const { admissionTimer } = getState().waitingRoom;

        // Defensively stop a previous timer.
        if (admissionTimer) {
            clearInterval(admissionTimer);
        }

        const expiresAt = Date.now() + ADMISSION_TIMEOUT_S * SECOND;
        dispatch(slice.actions.setAdmissionExpiresAt(expiresAt));

        const computeAndTick = () => {
            const { admissionExpiresAt, admissionStatus } = getState().waitingRoom;
            if (admissionExpiresAt === null) {
                return;
            }
            const remaining = Math.max(0, Math.ceil((admissionExpiresAt - Date.now()) / SECOND));
            dispatch(slice.actions.setAdmissionCountdown(remaining));
            if (remaining === 0 && admissionStatus === WaitingRoomAdmissionStatus.AWAITING) {
                dispatch(stopWaitingRoomAdmissionTimer());
                dispatch(slice.actions.setAdmissionStatus(WaitingRoomAdmissionStatus.EXPIRED));
            }
        };

        computeAndTick();
        const timer = window.setInterval(computeAndTick, SECOND);

        dispatch(slice.actions.setAdmissionTimer(timer));
    };

/** Stop the countdown timer and reset the whole slice (call this instead of the raw reducer). */
export const resetWaitingRoom = (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch) => {
    dispatch(stopWaitingRoomAdmissionTimer());
    dispatch(slice.actions._resetWaitingRoom());
};

/**
 * Returns true if waiting room is enabled and you are the waiting room host.
 */
export const selectIsWaitingRoomHost = createSelector(
    [selectWaitingRoomSetting, selectCanManageWaitingRoom],
    (waitingRoomSetting, canManageWaitingRoom) => {
        return waitingRoomSetting && canManageWaitingRoom;
    }
);

export const selectWaitingParticipants = (state: MeetState) => state.waitingRoom.waitingParticipants;
export const selectWaitingParticipantsCount = (state: MeetState) => state.waitingRoom.waitingParticipants.length;
export const selectAdmissionStatus = (state: MeetState) => state.waitingRoom.admissionStatus;
export const selectAdmissionCountdown = (state: MeetState) => state.waitingRoom.admissionCountdown;
/** True while the inline admission screen replaces the join form. `rejected` is excluded — it's a modal. */
export const selectIsWaitingRoomAdmissionActive = (state: MeetState) => {
    const status = state.waitingRoom.admissionStatus;
    return (
        status === WaitingRoomAdmissionStatus.HOST_NOT_STARTED ||
        status === WaitingRoomAdmissionStatus.AWAITING ||
        status === WaitingRoomAdmissionStatus.EXPIRED
    );
};
export const selectIsWaitingRoomRejected = (state: MeetState) =>
    state.waitingRoom.admissionStatus === WaitingRoomAdmissionStatus.REJECTED;

// Returns a hash of the missing names from the waiting room
export const selectMissingNamesFromWaitingRoomHash = createSelector(
    [selectWaitingParticipants, selectParticipantDecryptedNameMap],
    (waitingParticipants, participantDecryptedNameMap) => {
        if (waitingParticipants.length === 0) {
            return '';
        }

        const missingNames = waitingParticipants.filter(
            ({ participantUid }) => !participantDecryptedNameMap[participantUid]
        );

        if (missingNames.length === 0) {
            return '';
        }

        return missingNames
            .map(({ participantUid }) => participantUid)
            .sort()
            .join('|');
    }
);
export const selectWaitingParticipantsWithNames = createSelector(
    [selectWaitingParticipants, selectParticipantDecryptedNameMap],
    (waitingParticipants, participantDecryptedNameMap) => {
        return waitingParticipants
            .map((waitingParticipant) => ({
                ...waitingParticipant,
                name: participantDecryptedNameMap[waitingParticipant.participantUid],
            }))
            .filter(({ name }) => isTruthy(name));
    }
);

export const {
    addWaitingParticipant,
    removeWaitingParticipant,
    removeWaitingParticipants,
    pruneExpiredWaitingParticipants,
    setAdmissionStatus,
} = slice.actions;

export const waitingRoomReducer = { waitingRoom: slice.reducer };
