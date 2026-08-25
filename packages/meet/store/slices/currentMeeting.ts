import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { MINUTE } from '@proton/shared/lib/constants';

import type { KeyRotationLog, MLSGroupState } from '../../types/types';
import { getMeetingLink } from '../../utils/getMeetingLink';
import type { MeetState } from '../rootReducer';
import { selectExpirationTime, selectMaxDuration, selectMeetingInfoModel } from './meetingInfoModel';

/**
 * Meeting facts carried over by the dashboard navigation so the prejoin can paint before the
 * meeting info request resolves. Partial on purpose: the meetings list does not know the rest.
 */
export interface NavigationMeetingSeed {
    meetingName: string;
    isPersonalRoom: boolean;
    canManageWaitingRoom: boolean;
}

export interface CurrentMeetingState {
    // 10 digits ID, livekit Room.name
    meetingLinkName: string;
    // Meeting password
    meetingPassword: string;
    instantMeeting: boolean;
    displayName: string;
    mlsGroupState: MLSGroupState | null;
    keyRotationLogs: KeyRotationLog[];
    meetingDurationMs: number;
    timeLeftMs: number;
    isExpiringSoon: boolean;
    meetingDurationTimer: number | null;
    isMeetingLoading: boolean;
    navigationSeed: NavigationMeetingSeed | null;
}

export const initialState: CurrentMeetingState = {
    meetingLinkName: '',
    meetingPassword: '',
    instantMeeting: false,
    displayName: '',
    mlsGroupState: null,
    keyRotationLogs: [],
    meetingDurationMs: 0,
    timeLeftMs: 0,
    isExpiringSoon: false,
    meetingDurationTimer: null,
    isMeetingLoading: true,
    navigationSeed: null,
};

/**
 * State of the meeting the user is currently in, from prejoin to in-call.
 * What the server reported about it lives in the meetingInfoModel instead.
 */
const slice = createSlice({
    name: 'currentMeeting',
    initialState,
    reducers: {
        setCurrentMeeting: (state, action: PayloadAction<Partial<CurrentMeetingState>>) => {
            return { ...state, ...action.payload };
        },
        setNavigationSeed: (state, action: PayloadAction<NavigationMeetingSeed>) => {
            state.navigationSeed = action.payload;
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
        resetCurrentMeeting: () => initialState,
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
        const { meetingDurationTimer } = getState().currentMeeting;

        // Defensively stop previous timer
        if (meetingDurationTimer) {
            clearInterval(meetingDurationTimer);
        }

        const computeAndTick = () => {
            const expirationTime = selectExpirationTime(getState());
            const maxDuration = selectMaxDuration(getState());
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
        const { meetingDurationTimer } = getState().currentMeeting;

        if (meetingDurationTimer) {
            clearInterval(meetingDurationTimer);
        }

        dispatch(slice.actions.setMeetingDurationTimer(null));
    };

export const {
    setCurrentMeeting,
    setNavigationSeed,
    setDisplayName,
    setMlsGroupState,
    resetCurrentMeeting,
    addKeyRotationLog,
} = slice.actions;

export const selectCurrentMeeting = (state: MeetState) => state.currentMeeting;
const selectNavigationSeed = (state: MeetState) => state.currentMeeting.navigationSeed;
// TODO(follow-up): rename to selectMeetingName and migrate consumers
export const selectRoomName = (state: MeetState) =>
    selectMeetingInfoModel(state).value?.meetingName ?? selectNavigationSeed(state)?.meetingName ?? '';
export const selectIsPersonalRoom = (state: MeetState) => {
    const meetingInfo = selectMeetingInfoModel(state).value?.meetingInfo;

    return meetingInfo ? !!meetingInfo.PersonalMeeting : (selectNavigationSeed(state)?.isPersonalRoom ?? false);
};
export const selectCanManageWaitingRoom = (state: MeetState) => {
    const meetingInfo = selectMeetingInfoModel(state).value?.meetingInfo;

    return meetingInfo ? !!meetingInfo.ManageWaitingRoom : (selectNavigationSeed(state)?.canManageWaitingRoom ?? false);
};
export const selectMeetingLinkName = (state: MeetState) => state.currentMeeting.meetingLinkName;
export const selectMeetingPassword = (state: MeetState) => state.currentMeeting.meetingPassword;
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
export const selectInstantMeeting = (state: MeetState) => state.currentMeeting.instantMeeting;
export const selectDisplayName = (state: MeetState) => state.currentMeeting.displayName;

export const selectMlsGroupState = (state: MeetState) => state.currentMeeting.mlsGroupState;
export const selectKeyRotationLogs = (state: MeetState) => state.currentMeeting.keyRotationLogs;

export const selectMeetingDurationMs = (state: MeetState) => state.currentMeeting.meetingDurationMs;
export const selectTimeLeftMs = (state: MeetState) => state.currentMeeting.timeLeftMs;
export const selectIsExpiringSoon = (state: MeetState) => state.currentMeeting.isExpiringSoon;
export const selectIsMeetingLoading = (state: MeetState) => state.currentMeeting.isMeetingLoading;
export const selectMeetingNavigationSeed = (state: MeetState) => state.currentMeeting.navigationSeed;

export { selectMaxParticipants } from './meetingInfoModel';
export { selectExpirationTime, selectMaxDuration };

export const currentMeetingReducer = { currentMeeting: slice.reducer };
