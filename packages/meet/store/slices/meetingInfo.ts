import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { KeyRotationLog, MLSGroupState, ParticipantEntity } from '../../types/types';
import type { MeetState } from '../rootReducer';

export interface MeetingInfoState {
    roomName: string;
    meetingLink: string;
    paidUser: boolean;
    maxDuration: number;
    maxParticipants: number;
    expirationTime: number | null;
    instantMeeting: boolean;
    displayName: string;
    passphrase: string;
    isGuestAdmin: boolean;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    mlsGroupState: MLSGroupState | null;
    isLocalScreenShare: boolean;
    isScreenShare: boolean;
    keyRotationLogs: KeyRotationLog[];
}

export const initialState: MeetingInfoState = {
    roomName: '',
    meetingLink: '',
    paidUser: false,
    maxDuration: 0,
    maxParticipants: 0,
    expirationTime: null,
    instantMeeting: false,
    displayName: '',
    passphrase: '',
    isGuestAdmin: false,
    participantsMap: {},
    participantNameMap: {},
    mlsGroupState: null,
    isLocalScreenShare: false,
    isScreenShare: false,
    keyRotationLogs: [],
};

const slice = createSlice({
    name: 'meetingInfo',
    initialState,
    reducers: {
        setMeetingInfo: (state, action: PayloadAction<Partial<MeetingInfoState>>) => {
            return { ...state, ...action.payload };
        },
        setRoomName: (state, action: PayloadAction<string>) => {
            state.roomName = action.payload;
        },
        setMeetingLink: (state, action: PayloadAction<string>) => {
            state.meetingLink = action.payload;
        },
        setExpirationTime: (state, action: PayloadAction<number | null>) => {
            state.expirationTime = action.payload;
        },
        setDisplayName: (state, action: PayloadAction<string>) => {
            state.displayName = action.payload;
        },
        setIsGuestAdmin: (state, action: PayloadAction<boolean>) => {
            state.isGuestAdmin = action.payload;
        },
        setMlsGroupState: (state, action: PayloadAction<MLSGroupState | null>) => {
            state.mlsGroupState = action.payload;
        },
        addKeyRotationLog: (state, action: PayloadAction<KeyRotationLog>) => {
            state.keyRotationLogs = [...state.keyRotationLogs, action.payload];
        },
        resetMeetingInfo: () => initialState,
    },
});

export const {
    setMeetingInfo,
    setRoomName,
    setMeetingLink,
    setExpirationTime,
    setDisplayName,
    setIsGuestAdmin,
    setMlsGroupState,
    resetMeetingInfo,
    addKeyRotationLog,
} = slice.actions;

export const selectMeetingInfo = (state: MeetState) => state.meetingInfo;
export const selectRoomName = (state: MeetState) => state.meetingInfo.roomName;
export const selectMeetingLink = (state: MeetState) => state.meetingInfo.meetingLink;
export const selectPaidUser = (state: MeetState) => state.meetingInfo.paidUser;
export const selectMaxDuration = (state: MeetState) => state.meetingInfo.maxDuration;
export const selectMaxParticipants = (state: MeetState) => state.meetingInfo.maxParticipants;
export const selectExpirationTime = (state: MeetState) => state.meetingInfo.expirationTime;
export const selectInstantMeeting = (state: MeetState) => state.meetingInfo.instantMeeting;
export const selectDisplayName = (state: MeetState) => state.meetingInfo.displayName;
export const selectPassphrase = (state: MeetState) => state.meetingInfo.passphrase;
export const selectIsGuestAdmin = (state: MeetState) => state.meetingInfo.isGuestAdmin;
export const selectParticipantsMap = (state: MeetState) => state.meetingInfo.participantsMap;
export const selectParticipantNameMap = (state: MeetState) => state.meetingInfo.participantNameMap;
export const selectMlsGroupState = (state: MeetState) => state.meetingInfo.mlsGroupState;
export const selectIsLocalScreenShare = (state: MeetState) => state.meetingInfo.isLocalScreenShare;
export const selectIsScreenShare = (state: MeetState) => state.meetingInfo.isScreenShare;
export const selectIsSharingScreen = (state: MeetState) =>
    state.meetingInfo.isLocalScreenShare && state.meetingInfo.isScreenShare;
export const selectKeyRotationLogs = (state: MeetState) => state.meetingInfo.keyRotationLogs;

export const meetingInfoReducer = { meetingInfo: slice.reducer };
