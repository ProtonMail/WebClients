import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { lockMeetingCall, unlockMeetingCall } from '@proton/shared/lib/api/meet';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { MeetState } from '../rootReducer';
import type { MeetExtraThunkArguments } from '../store';
import type { ServerMeetingInfo } from './meetingInfoModel';
import { selectUserId } from './userSlice';

export interface MeetSettingsState {
    disableVideos: boolean;
    participantsWithDisabledVideos: string[];
    selfView: boolean;
    meetingLocked: boolean;
    pipEnabled: boolean;
    waitingRoomSetting: boolean;
    joinLeaveSoundsEnabled: boolean;
    mirrorSelfView: boolean;
}

export const initialState: MeetSettingsState = {
    disableVideos: false,
    participantsWithDisabledVideos: [],
    selfView: true,
    meetingLocked: false,
    pipEnabled: true,
    waitingRoomSetting: false,
    joinLeaveSoundsEnabled: true,
    mirrorSelfView: true,
};

const USER_SETTING_STORAGE_NAMES = {
    joinLeaveSoundsEnabled: 'joinLeaveSounds',
    mirrorSelfView: 'mirrorSelfView',
} as const;

type UserSetting = keyof typeof USER_SETTING_STORAGE_NAMES;

type UserSettings = Pick<MeetSettingsState, UserSetting>;

const getUserSettingStorageKey = (userId: string | undefined, setting: UserSetting) => {
    const storageName = USER_SETTING_STORAGE_NAMES[setting];

    return userId ? `user.${userId}.${storageName}` : `guest.${storageName}`;
};

const getPersistedUserSetting = (userId: string | undefined, setting: UserSetting) =>
    getItem(getUserSettingStorageKey(userId, setting)) !== 'false';

const getPersistedUserSettings = (userId?: string): UserSettings => ({
    joinLeaveSoundsEnabled: getPersistedUserSetting(userId, 'joinLeaveSoundsEnabled'),
    mirrorSelfView: getPersistedUserSetting(userId, 'mirrorSelfView'),
});

export const getPersistedSettingsState = (userId?: string): MeetSettingsState => ({
    ...initialState,
    ...getPersistedUserSettings(userId),
});

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
            text: shouldLock
                ? c('Error').t`Meeting not locked. Try again.`
                : c('Error').t`Meeting not unlocked. Try again.`,
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
        setPipEnabled: (state, action: PayloadAction<boolean>) => {
            state.pipEnabled = action.payload;
        },
        setWaitingRoomSetting: (state, action: PayloadAction<boolean>) => {
            state.waitingRoomSetting = action.payload;
        },
        hydrateMeetingPolicies: (state, action: PayloadAction<ServerMeetingInfo>) => {
            state.meetingLocked = !!action.payload.Locked;
            state.waitingRoomSetting = !!action.payload.WaitingRoom;
        },
        resetWaitingRoomSetting: (state) => {
            state.waitingRoomSetting = initialState.waitingRoomSetting;
        },
        setUserSettings: (state, action: PayloadAction<Partial<UserSettings>>) => ({ ...state, ...action.payload }),
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
    setSelfView,
    setPipEnabled,
    setWaitingRoomSetting,
    hydrateMeetingPolicies,
    resetWaitingRoomSetting,
} = slice.actions;

export const selectMeetSettings = (state: MeetState) => state.meetSettings;
export const selectParticipantsWithDisabledVideos = (state: MeetState) =>
    state.meetSettings.participantsWithDisabledVideos;
export const selectSelfView = (state: MeetState) => state.meetSettings.selfView;
export const selectWaitingRoomSetting = (state: MeetState) => state.meetSettings.waitingRoomSetting;
export const selectJoinLeaveSoundsEnabled = (state: MeetState) => state.meetSettings.joinLeaveSoundsEnabled;
export const selectMirrorSelfView = (state: MeetState) => state.meetSettings.mirrorSelfView;

export const loadPersistedUserSettings =
    (): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> => (dispatch, getState) => {
        dispatch(slice.actions.setUserSettings(getPersistedUserSettings(selectUserId(getState()))));
    };

const setUserSettingAndPersist =
    (setting: UserSetting, enabled: boolean): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> =>
    (dispatch, getState) => {
        dispatch(slice.actions.setUserSettings({ [setting]: enabled }));
        setItem(getUserSettingStorageKey(selectUserId(getState()), setting), enabled.toString());
    };

export const setJoinLeaveSoundsEnabledAndPersist = (enabled: boolean) =>
    setUserSettingAndPersist('joinLeaveSoundsEnabled', enabled);

export const setMirrorSelfViewAndPersist = (enabled: boolean) => setUserSettingAndPersist('mirrorSelfView', enabled);

export const settingsReducer = { meetSettings: slice.reducer };
