import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { ParticipantEntity } from '../../../types/types';
import { ParticipantCapabilityPermission } from '../../../types/types';
import type { MeetState } from '../../rootReducer';

export interface ParticipantsState {
    localParticipantIdentity: string;
    localParticipantColorIndex: number;
    isGuestAdmin: boolean;
    participantsMap: Record<string, ParticipantEntity>;
    participantDecryptedNameMap: Record<string, string>;
    isFetchingParticipants: boolean;
    activeSpeakerIdentity: string | null;
}

export const initialState: ParticipantsState = {
    localParticipantIdentity: '',
    localParticipantColorIndex: 0,
    isGuestAdmin: false,
    participantsMap: {},
    participantDecryptedNameMap: {},
    isFetchingParticipants: false,
    activeSpeakerIdentity: null,
};

const slice = createSlice({
    name: 'participants',
    initialState,
    reducers: {
        setLocalParticipantIdentity: (state, action: PayloadAction<string>) => {
            state.localParticipantIdentity = action.payload;
        },
        setLocalParticipantColorIndex: (state, action: PayloadAction<number>) => {
            state.localParticipantColorIndex = action.payload;
        },
        setIsGuestAdmin: (state, action: PayloadAction<boolean>) => {
            state.isGuestAdmin = action.payload;
        },
        setActiveSpeakerIdentity: (state, action: PayloadAction<string>) => {
            state.activeSpeakerIdentity = action.payload;
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
        resetParticipants: () => initialState,
        setIsFetchingParticipants: (state, action: PayloadAction<boolean>) => {
            state.isFetchingParticipants = action.payload;
        },
    },
});

export const {
    setLocalParticipantIdentity,
    setLocalParticipantColorIndex,
    setIsGuestAdmin,
    mergeParticipantsMap,
    mergeParticipantDecryptedNameMap,
    removeParticipantFromMap,
    resetParticipantMaps,
    setParticipantAdmin,
    setIsFetchingParticipants,
    setActiveSpeakerIdentity,
    resetParticipants,
} = slice.actions;

export const selectIsGuestAdmin = (state: MeetState) => state.participants.isGuestAdmin;

export const selectParticipantsMap = (state: MeetState) => state.participants.participantsMap;
export const selectParticipantDecryptedNameMap = (state: MeetState) => state.participants.participantDecryptedNameMap;
export const selectParticipantName = createSelector(
    [selectParticipantDecryptedNameMap, (_state: MeetState, identity: string) => identity],
    (participantDecryptedNameMap, identity) => participantDecryptedNameMap[identity] ?? ''
);
export const selectParticipantIsHostOrAdmin = createSelector(
    [selectParticipantsMap, (_state: MeetState, identity: string) => identity],
    (participantsMap, identity) => {
        const participant = participantsMap[identity];

        return !!participant?.IsAdmin || !!participant?.IsHost;
    }
);

export const selectLocalParticipantColorIndex = (state: MeetState) => {
    return state.participants.localParticipantColorIndex;
};

export const selectActiveSpeakerIdentity = (state: MeetState) => state.participants.activeSpeakerIdentity;

export const selectLocalParticipantIdentity = (state: MeetState) => {
    return state.participants.localParticipantIdentity;
};

export const selectIsLocalParticipantAdmin = createSelector(
    [selectParticipantsMap, selectLocalParticipantIdentity],
    (participantsMap, localParticipantIdentity) => {
        const participant = participantsMap[localParticipantIdentity];
        return !!participant?.IsAdmin;
    }
);

export const selectIsLocalParticipantHost = createSelector(
    [selectParticipantsMap, selectLocalParticipantIdentity],
    (participantsMap, localParticipantIdentity) => {
        const participant = participantsMap[localParticipantIdentity];
        return !!participant?.IsHost;
    }
);

export const selectIsLocalParticipantAdminOrHost = createSelector(
    [selectParticipantsMap, selectLocalParticipantIdentity],
    (participantsMap, localParticipantIdentity) => {
        const participant = participantsMap[localParticipantIdentity];
        return !!participant?.IsAdmin || !!participant?.IsHost;
    }
);

export const selectHasAnotherAdmin = createSelector([selectParticipantsMap], (participantsMap) => {
    return (
        Object.values(participantsMap).filter((participant) => !!participant.IsAdmin || !!participant.IsHost).length > 1
    );
});

export const selectHostIsPresent = createSelector([selectParticipantsMap], (participantsMap) => {
    return Object.values(participantsMap).some((participant) => !!participant.IsHost);
});

export const participantsReducer = { participants: slice.reducer };
