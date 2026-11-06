import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';

export interface ConnectionState {
    joinedRoom: boolean;
    joiningInProgress: boolean;
    isReconnecting: boolean;
    reconnectionFailed: boolean;
    mlsRetrying: boolean;
    isWebsocketReconnecting: boolean;
    prejoinParticipantCount: number | null;
}

export const initialState: ConnectionState = {
    joinedRoom: false,
    joiningInProgress: false,
    isReconnecting: false,
    reconnectionFailed: false,
    mlsRetrying: false,
    isWebsocketReconnecting: false,
    prejoinParticipantCount: null,
};

const slice = createSlice({
    name: 'connection',
    initialState,
    reducers: {
        setJoinedRoom: (state, action: PayloadAction<boolean>) => {
            state.joinedRoom = action.payload;
        },
        setJoiningInProgress: (state, action: PayloadAction<boolean>) => {
            state.joiningInProgress = action.payload;
        },
        setIsReconnecting: (state, action: PayloadAction<boolean>) => {
            state.isReconnecting = action.payload;
        },
        setReconnectionFailed: (state, action: PayloadAction<boolean>) => {
            state.reconnectionFailed = action.payload;
        },
        setMlsRetrying: (state, action: PayloadAction<boolean>) => {
            state.mlsRetrying = action.payload;
        },
        setIsWebsocketReconnecting: (state, action: PayloadAction<boolean>) => {
            state.isWebsocketReconnecting = action.payload;
        },
        setPrejoinParticipantCount: (state, action: PayloadAction<number | null>) => {
            state.prejoinParticipantCount = action.payload;
        },
        resetConnection: () => initialState,
    },
});

export const {
    setJoinedRoom,
    setJoiningInProgress,
    setIsReconnecting,
    setReconnectionFailed,
    setMlsRetrying,
    setIsWebsocketReconnecting,
    setPrejoinParticipantCount,
    resetConnection,
} = slice.actions;

export const selectJoinedRoom = (state: MeetState) => state.connection.joinedRoom;
export const selectJoiningInProgress = (state: MeetState) => state.connection.joiningInProgress;
export const selectIsReconnecting = (state: MeetState) => state.connection.isReconnecting;
export const selectReconnectionFailed = (state: MeetState) => state.connection.reconnectionFailed;
export const selectMlsRetrying = (state: MeetState) => state.connection.mlsRetrying;
export const selectIsWebsocketReconnecting = (state: MeetState) => state.connection.isWebsocketReconnecting;
export const selectPrejoinParticipantCount = (state: MeetState) => state.connection.prejoinParticipantCount;

export const connectionReducer = { connection: slice.reducer };
