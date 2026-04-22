import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { KeyRotationLog, MLSGroupState, ParticipantEntity } from '../../types/types';
import { ParticipantCapabilityPermission } from '../../types/types';
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
    participantDecryptedNameMap: Record<string, string>;
    isFetchingParticipants: boolean;
    mlsGroupState: MLSGroupState | null;
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
    participantDecryptedNameMap: {},
    isFetchingParticipants: false,
    mlsGroupState: null,
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
        mergeParticipantsMap: (state, action: PayloadAction<Record<string, ParticipantEntity>>) => {
            state.participantsMap = { ...state.participantsMap, ...action.payload };
        },
        mergeParticipantDecryptedNameMap: (state, action: PayloadAction<Record<string, string>>) => {
            state.participantDecryptedNameMap = { ...state.participantDecryptedNameMap, ...action.payload };
        },
        removeParticipantFromMap: (state, action: PayloadAction<string>) => {
            const next = { ...state.participantsMap };
            delete next[action.payload];
            state.participantsMap = next;
        },
        resetParticipantMaps: (state) => {
            state.participantsMap = {};
            state.participantDecryptedNameMap = {};
            state.isFetchingParticipants = false;
        },
        setParticipantAdmin: (state, action: PayloadAction<{ participantUid: string; participantType: number }>) => {
            const { participantUid, participantType } = action.payload;
            state.participantsMap = Object.fromEntries(
                Object.entries(state.participantsMap).map(([key, value]) => {
                    const isTargetParticipant = value.ParticipantUUID === participantUid;
                    const isAdmin = isTargetParticipant && participantType === 1;
                    const adminPermission = isAdmin ? ParticipantCapabilityPermission.Allowed : value.IsAdmin;
                    return [key, { ...value, IsAdmin: adminPermission }];
                })
            );
        },
        resetMeetingInfo: () => initialState,
        setIsFetchingParticipants: (state, action: PayloadAction<boolean>) => {
            state.isFetchingParticipants = action.payload;
        },
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
    mergeParticipantsMap,
    mergeParticipantDecryptedNameMap,
    removeParticipantFromMap,
    resetParticipantMaps,
    setParticipantAdmin,
    setIsFetchingParticipants,
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
export const selectParticipantDecryptedNameMap = (state: MeetState) => state.meetingInfo.participantDecryptedNameMap;
export const selectParticipantName = createSelector(
    [selectParticipantDecryptedNameMap, (_state: MeetState, identity: string) => identity],
    (participantDecryptedNameMap, identity) => participantDecryptedNameMap[identity] ?? ''
);
export const selectParticipantIsHost = createSelector(
    [selectParticipantsMap, (_state: MeetState, identity: string) => identity],
    (participantsMap, identity) => {
        const participant = participantsMap[identity];

        return Boolean(participant?.IsAdmin);
    }
);

export const selectMlsGroupState = (state: MeetState) => state.meetingInfo.mlsGroupState;
export const selectKeyRotationLogs = (state: MeetState) => state.meetingInfo.keyRotationLogs;

export const meetingInfoReducer = { meetingInfo: slice.reducer };
