import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';

export enum MeetingSideBars {
    Participants = 'Participants',
    AssignHost = 'AssignHost',
    Settings = 'Settings',
    Chat = 'Chat',
    MeetingDetails = 'MeetingDetails',
}

export enum PopUpControls {
    Microphone = 'Microphone',
    Camera = 'Camera',
    LeaveMeetingParticipant = 'LeaveMeetingParticipant',
    LeaveMeeting = 'LeaveMeeting',
    EndMeeting = 'EndMeeting',
    ScreenShareLeaveWarning = 'ScreenShareLeaveWarning',
}

export enum PermissionPromptStatus {
    CAMERA = 'CAMERA',
    MICROPHONE = 'MICROPHONE',
    CLOSED = 'CLOSED',
}

export interface UIState {
    meetingReadyPopupOpen: boolean;
    showDuration: boolean;
    sideBarState: {
        [MeetingSideBars.Participants]: boolean;
        [MeetingSideBars.AssignHost]: boolean;
        [MeetingSideBars.Settings]: boolean;
        [MeetingSideBars.Chat]: boolean;
        [MeetingSideBars.MeetingDetails]: boolean;
    };
    popupState: Record<PopUpControls, boolean>;
    permissionPromptStatus: PermissionPromptStatus;
    noDeviceDetected: PermissionPromptStatus;
}

const initialState: UIState = {
    meetingReadyPopupOpen: false,
    showDuration: false,
    sideBarState: {
        [MeetingSideBars.Participants]: false,
        [MeetingSideBars.AssignHost]: false,
        [MeetingSideBars.Settings]: false,
        [MeetingSideBars.Chat]: false,
        [MeetingSideBars.MeetingDetails]: false,
    },
    popupState: {
        [PopUpControls.Microphone]: false,
        [PopUpControls.Camera]: false,
        [PopUpControls.LeaveMeeting]: false,
        [PopUpControls.LeaveMeetingParticipant]: false,
        [PopUpControls.ScreenShareLeaveWarning]: false,
        [PopUpControls.EndMeeting]: false,
    },
    permissionPromptStatus: PermissionPromptStatus.CLOSED,
    noDeviceDetected: PermissionPromptStatus.CLOSED,
};

const slice = createSlice({
    name: 'uiState',
    initialState,
    reducers: {
        toggleShowDuration: (state) => {
            state.showDuration = !state.showDuration;
        },
        setMeetingReadyPopupOpen: (state, action: PayloadAction<boolean>) => {
            state.meetingReadyPopupOpen = action.payload;
        },
        toggleSideBarState: (state, action: PayloadAction<MeetingSideBars>) => {
            const sidebar = action.payload;
            const wasOpen = state.sideBarState[sidebar];

            Object.keys(state.sideBarState).forEach((key) => {
                state.sideBarState[key as MeetingSideBars] = false;
            });

            state.sideBarState[sidebar] = !wasOpen;
        },
        closeSideBar: (state, action: PayloadAction<MeetingSideBars>) => {
            state.sideBarState[action.payload] = false;
        },
        closeAllSideBars: (state) => {
            Object.keys(state.sideBarState).forEach((key) => {
                state.sideBarState[key as MeetingSideBars] = false;
            });
        },
        togglePopupState: (state, action: PayloadAction<PopUpControls>) => {
            const popup = action.payload;
            const wasOpen = state.popupState[popup];

            Object.keys(state.popupState).forEach((key) => {
                state.popupState[key as PopUpControls] = false;
            });

            state.popupState[popup] = !wasOpen;
        },
        setPopupStateValue: (state, action: PayloadAction<{ popup: PopUpControls; value: boolean }>) => {
            const { popup, value } = action.payload;
            state.popupState[popup] = value;
        },
        closeAllPopups: (state) => {
            Object.keys(state.popupState).forEach((key) => {
                state.popupState[key as PopUpControls] = false;
            });
        },
        setPermissionPromptStatus: (state, action: PayloadAction<PermissionPromptStatus>) => {
            state.permissionPromptStatus = action.payload;
        },
        setNoDeviceDetected: (state, action: PayloadAction<PermissionPromptStatus>) => {
            state.noDeviceDetected = action.payload;
        },
    },
});

export const {
    setMeetingReadyPopupOpen,
    toggleShowDuration,
    toggleSideBarState,
    closeSideBar,
    closeAllSideBars,
    togglePopupState,
    setPopupStateValue,
    closeAllPopups,
    setPermissionPromptStatus,
    setNoDeviceDetected,
} = slice.actions;

// Selectors
export const selectMeetingReadyPopupOpen = (state: MeetState) => state.uiState.meetingReadyPopupOpen;
export const selectSideBarState = (state: MeetState) => state.uiState.sideBarState;
export const selectPopupState = (state: MeetState) => state.uiState.popupState;
export const selectPermissionPromptStatus = (state: MeetState) => state.uiState.permissionPromptStatus;
export const selectNoDeviceDetected = (state: MeetState) => state.uiState.noDeviceDetected;
export const selectShowDuration = (state: MeetState) => state.uiState.showDuration;

export const uiStateReducer = { uiState: slice.reducer };
