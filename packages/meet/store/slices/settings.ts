import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { lockMeetingCall, unlockMeetingCall } from '@proton/shared/lib/api/meet';

import type { MeetState } from '../rootReducer';
import type { MeetExtraThunkArguments } from '../store';

export interface MeetSettingsState {
    disableVideos: boolean;
    participantsWithDisabledVideos: string[];
    selfView: boolean;
    meetingLocked: boolean;
    pipEnabled: boolean;
    waitingRoomSetting: boolean;
}

export const initialState: MeetSettingsState = {
    disableVideos: false,
    participantsWithDisabledVideos: [],
    selfView: true,
    meetingLocked: false,
    pipEnabled: true,
    waitingRoomSetting: false,
};

export const toggleMeetingLockThunk = createAsyncThunk<
    boolean,
    { meetingLinkName: string; accessToken: string },
    { state: MeetState; extra: MeetExtraThunkArguments }
>('meetSettings/toggleMeetingLock', async ({ meetingLinkName, accessToken }, { getState, extra, rejectWithValue }) => {
    const { api, notificationsManager } = extra;
    const isCurrentlyLocked = getState().meetSettings.meetingLocked;
    const shouldLock = !isCurrentlyLocked;
    const call = shouldLock ? lockMeetingCall : unlockMeetingCall;

    try {
        await api(call(meetingLinkName, { AccessToken: accessToken }));

        notificationsManager?.createNotification({
            type: 'info',
            text: shouldLock
                ? c('Info').t`Meeting locked. No new participants can join.`
                : c('Info').t`Meeting unlocked. Participants can join again.`,
        });

        return shouldLock;
    } catch (error) {
        notificationsManager?.createNotification({
            type: 'error',
            text: shouldLock ? c('Error').t`Failed to lock meeting` : c('Error').t`Failed to unlock meeting`,
        });

        return rejectWithValue(error);
    }
});

const slice = createSlice({
    name: 'meetSettings',
    initialState,
    reducers: {
        setDisableVideos: (state, action: PayloadAction<boolean>) => {
            state.disableVideos = action.payload;
        },
        disableParticipantVideo: (state, action: PayloadAction<string>) => {
            state.participantsWithDisabledVideos = [...state.participantsWithDisabledVideos, action.payload];
        },
        enableParticipantVideo: (state, action: PayloadAction<string>) => {
            state.participantsWithDisabledVideos = state.participantsWithDisabledVideos.filter(
                (id) => id !== action.payload
            );
        },
        setParticipantsWithDisabledVideos: (state, action: PayloadAction<string[]>) => {
            state.participantsWithDisabledVideos = action.payload;
        },
        setSelfView: (state, action: PayloadAction<boolean>) => {
            state.selfView = action.payload;
        },
        setMeetingLocked: (state, action: PayloadAction<boolean>) => {
            state.meetingLocked = action.payload;
        },
        setPipEnabled: (state, action: PayloadAction<boolean>) => {
            state.pipEnabled = action.payload;
        },
        setWaitingRoomSetting: (state, action: PayloadAction<boolean>) => {
            state.waitingRoomSetting = action.payload;
        },
        resetWaitingRoomSetting: (state) => {
            state.waitingRoomSetting = initialState.waitingRoomSetting;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(toggleMeetingLockThunk.fulfilled, (state, action) => {
            state.meetingLocked = action.payload;
        });
    },
});

export const {
    setDisableVideos,
    disableParticipantVideo,
    enableParticipantVideo,
    setParticipantsWithDisabledVideos,
    setSelfView,
    setMeetingLocked,
    setPipEnabled,
    setWaitingRoomSetting,
    resetWaitingRoomSetting,
} = slice.actions;

export const selectMeetSettings = (state: MeetState) => state.meetSettings;
export const selectParticipantsWithDisabledVideos = (state: MeetState) =>
    state.meetSettings.participantsWithDisabledVideos;
export const selectSelfView = (state: MeetState) => state.meetSettings.selfView;
export const selectWaitingRoomSetting = (state: MeetState) => state.meetSettings.waitingRoomSetting;

export const settingsReducer = { meetSettings: slice.reducer };
