import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { MINUTE } from '@proton/shared/lib/constants';

import type { KeyRotationLog, MLSGroupState } from '../../types/types';
import { getMeetingLink } from '../../utils/getMeetingLink';
import type { MeetState } from '../rootReducer';

export interface MeetingInfoState {
    // Decrypted meeting name
    meetingName: string;
    // 10 digits ID, livekit Room.name
    meetingLinkName: string;
    // Meeting password
    meetingPassword: string;
    maxParticipants: number;
    maxDuration: number;
    expirationTime: number | null;
    instantMeeting: boolean;
    displayName: string;
    mlsGroupState: MLSGroupState | null;
    keyRotationLogs: KeyRotationLog[];
    meetingDurationMs: number;
    timeLeftMs: number;
    isExpiringSoon: boolean;
    meetingDurationTimer: number | null;
    isPersonalRoom: boolean;
    canManageWaitingRoom: boolean;
    isMeetingLoading: boolean;
}

export const initialState: MeetingInfoState = {
    meetingName: '',
    meetingLinkName: '',
    meetingPassword: '',
    maxParticipants: 0,
    maxDuration: 0,
    expirationTime: null,
    instantMeeting: false,
    displayName: '',
    mlsGroupState: null,
    keyRotationLogs: [],
    meetingDurationMs: 0,
    timeLeftMs: 0,
    isExpiringSoon: false,
    meetingDurationTimer: null,
    isPersonalRoom: false,
    canManageWaitingRoom: false,
    isMeetingLoading: true,
};

/**
 * Meeting info slice.
 * Stores the current meeting info during prejoin and in-call.
 */
const slice = createSlice({
    name: 'meetingInfo',
    initialState,
    reducers: {
        setMeetingInfo: (state, action: PayloadAction<Partial<MeetingInfoState>>) => {
            return { ...state, ...action.payload };
        },
        setRoomName: (state, action: PayloadAction<string>) => {
            state.meetingName = action.payload;
        },
        setExpirationTime: (state, action: PayloadAction<number | null>) => {
            state.expirationTime = action.payload;
        },
        setDisplayName: (state, action: PayloadAction<string>) => {
            state.displayName = action.payload;
        },
        setMlsGroupState: (state, action: PayloadAction<MLSGroupState | null>) => {
            state.mlsGroupState = action.payload;
        },
        addKeyRotationLog: (state, action: PayloadAction<KeyRotationLog>) => {
            state.keyRotationLogs = [...state.keyRotationLogs, action.payload];
        },
        resetMeetingInfo: () => initialState,
        tickMeetingDuration: (
            state,
            action: PayloadAction<{ meetingDurationMs: number; timeLeftMs: number; isExpiringSoon: boolean }>
        ) => {
            state.meetingDurationMs = action.payload.meetingDurationMs;
            state.timeLeftMs = action.payload.timeLeftMs;
            state.isExpiringSoon = action.payload.isExpiringSoon;
        },
        setMeetingDurationTimer: (state, action: PayloadAction<number | null>) => {
            state.meetingDurationTimer = action.payload;
        },
    },
});

export const startMeetingDurationTimer =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        const { meetingDurationTimer } = getState().meetingInfo;

        // Defensively stop previous timer
        if (meetingDurationTimer) {
            clearInterval(meetingDurationTimer);
        }

        const computeAndTick = () => {
            const { expirationTime, maxDuration } = getState().meetingInfo;
            if (!expirationTime) {
                return;
            }
            const startTime = expirationTime - maxDuration * 1000;
            const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
            const remainingSeconds = Math.max(0, maxDuration - elapsedSeconds);
            dispatch(
                slice.actions.tickMeetingDuration({
                    meetingDurationMs: elapsedSeconds * 1000,
                    timeLeftMs: remainingSeconds * 1000,
                    isExpiringSoon: remainingSeconds * 1000 <= 5 * MINUTE,
                })
            );
        };

        computeAndTick();
        const timer = window.setInterval(computeAndTick, 1000);

        dispatch(slice.actions.setMeetingDurationTimer(timer));
    };

export const stopMeetingDurationTimer =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        const { meetingDurationTimer } = getState().meetingInfo;

        if (meetingDurationTimer) {
            clearInterval(meetingDurationTimer);
        }

        dispatch(slice.actions.setMeetingDurationTimer(null));
    };

export const {
    setMeetingInfo,
    setRoomName,
    setExpirationTime,
    setDisplayName,
    setMlsGroupState,
    resetMeetingInfo,
    addKeyRotationLog,
} = slice.actions;

export const selectMeetingInfo = (state: MeetState) => state.meetingInfo;
// TODO(follow-up): rename to selectMeetingName and migrate consumers
export const selectRoomName = (state: MeetState) => state.meetingInfo.meetingName;
export const selectMeetingLinkName = (state: MeetState) => state.meetingInfo.meetingLinkName;
export const selectMeetingPassword = (state: MeetState) => state.meetingInfo.meetingPassword;
export const selectMeetingLink = createSelector(
    selectMeetingLinkName,
    selectMeetingPassword,
    (meetingLinkName, meetingPassword) =>
        `${window.location.origin}${
            meetingLinkName && meetingPassword
                ? getMeetingLink(meetingLinkName, meetingPassword)
                : window.location.pathname
        }`
);
export const selectMaxParticipants = (state: MeetState) => state.meetingInfo.maxParticipants;
export const selectMaxDuration = (state: MeetState) => state.meetingInfo.maxDuration;
export const selectExpirationTime = (state: MeetState) => state.meetingInfo.expirationTime;
export const selectInstantMeeting = (state: MeetState) => state.meetingInfo.instantMeeting;
export const selectDisplayName = (state: MeetState) => state.meetingInfo.displayName;

export const selectMlsGroupState = (state: MeetState) => state.meetingInfo.mlsGroupState;
export const selectKeyRotationLogs = (state: MeetState) => state.meetingInfo.keyRotationLogs;

export const selectMeetingDurationMs = (state: MeetState) => state.meetingInfo.meetingDurationMs;
export const selectTimeLeftMs = (state: MeetState) => state.meetingInfo.timeLeftMs;
export const selectIsExpiringSoon = (state: MeetState) => state.meetingInfo.isExpiringSoon;
export const selectIsPersonalRoom = (state: MeetState) => state.meetingInfo.isPersonalRoom;
export const selectCanManageWaitingRoom = (state: MeetState) => state.meetingInfo.canManageWaitingRoom;
export const selectIsMeetingLoading = (state: MeetState) => state.meetingInfo.isMeetingLoading;

export const meetingInfoReducer = { meetingInfo: slice.reducer };
