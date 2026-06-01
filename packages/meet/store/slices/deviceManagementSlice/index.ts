import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import type { SerializableDeviceInfo } from '../../../utils/deviceUtils';
import { isAudioSessionAvailable, setAudioSessionType } from '../../../utils/iosAudioSession';
import type { MeetState } from '../../rootReducer';
import { getLastUsedDeviceIdKey } from './constants';
import { type DeviceKind, type DeviceManagementState, PermissionsModalType } from './types';

export const deviceManagementInitialState: DeviceManagementState = {
    permissions: {
        camera: 'prompt',
        microphone: 'prompt',
    },
    cameras: [],
    microphones: [],
    speakers: [],
    preferredCameraId: null,
    preferredMicrophoneId: null,
    preferredSpeakerId: null,
    activeCameraId: '',
    activeMicrophoneId: '',
    activeAudioOutputId: '',
    initialCameraState: false,
    initialAudioState: false,
    userCameraIntent: null,
    uiModals: {
        permissionsModal: PermissionsModalType.NONE,
    },
};

const slice = createSlice({
    name: 'deviceManagement',
    initialState: () => ({
        ...deviceManagementInitialState,
        preferredCameraId: getItem(getLastUsedDeviceIdKey('videoinput')) || null,
        preferredMicrophoneId: getItem(getLastUsedDeviceIdKey('audioinput')) || null,
        preferredSpeakerId: getItem(getLastUsedDeviceIdKey('audiooutput')) || null,
    }),
    reducers: {
        setPermissions: (state, action: PayloadAction<{ camera?: PermissionState; microphone?: PermissionState }>) => {
            if (action.payload.camera !== undefined) {
                state.permissions.camera = action.payload.camera;
            }
            if (action.payload.microphone !== undefined) {
                state.permissions.microphone = action.payload.microphone;
            }
        },
        setDeviceList: (state, action: PayloadAction<{ kind: DeviceKind; devices: SerializableDeviceInfo[] }>) => {
            const { kind, devices } = action.payload;
            switch (kind) {
                case 'videoinput':
                    state.cameras = devices;
                    break;
                case 'audioinput':
                    state.microphones = devices;
                    break;
                case 'audiooutput':
                    state.speakers = devices;
                    break;
            }
        },
        setPreferredDevice: (state, action: PayloadAction<{ kind: DeviceKind; deviceId: string | null }>) => {
            const { kind, deviceId } = action.payload;
            switch (kind) {
                case 'videoinput':
                    state.preferredCameraId = deviceId;
                    break;
                case 'audioinput':
                    state.preferredMicrophoneId = deviceId;
                    break;
                case 'audiooutput':
                    state.preferredSpeakerId = deviceId;
                    break;
            }
        },
        setActiveDevice: (state, action: PayloadAction<{ kind: DeviceKind; deviceId: string }>) => {
            const { kind, deviceId } = action.payload;
            switch (kind) {
                case 'videoinput':
                    state.activeCameraId = deviceId;
                    break;
                case 'audioinput':
                    state.activeMicrophoneId = deviceId;
                    break;
                case 'audiooutput':
                    state.activeAudioOutputId = deviceId;
                    break;
            }
        },
        setInitialCameraState: (state, action: PayloadAction<boolean>) => {
            state.initialCameraState = action.payload;
        },
        setInitialAudioState: (state, action: PayloadAction<boolean>) => {
            state.initialAudioState = action.payload;
        },
        setUserCameraIntent: (state, action: PayloadAction<boolean | null>) => {
            state.userCameraIntent = action.payload;
        },
        dismissPermissionsModal: (state) => {
            state.uiModals.permissionsModal = PermissionsModalType.NONE;
        },
        showPermissionsModal: (state, action: PayloadAction<{ modal: PermissionsModalType }>) => {
            state.uiModals.permissionsModal = action.payload.modal;
        },
        resetDeviceManagement: () => deviceManagementInitialState,
    },
});

export class PermissionBlockedError extends Error {}

const AUTOREJECT_THRESHOLD_MS = 300;
const MOBILE_SAFARI_AUTOREJECT_THRESHOLD_MS = 1000;

const getAutoRejectThresholdMs = () => {
    if (isMobile() && isSafari()) {
        return MOBILE_SAFARI_AUTOREJECT_THRESHOLD_MS;
    }
    return AUTOREJECT_THRESHOLD_MS;
};

export const requestPermission =
    (
        deviceType: 'camera' | 'microphone',
        deviceId?: string
    ): ThunkAction<Promise<PermissionState>, MeetState, ProtonThunkArguments, UnknownAction> =>
    async (dispatch, getState) => {
        const permissions = getState().deviceManagement.permissions;
        const currentPermission = permissions[deviceType];
        if (currentPermission === 'granted') {
            return 'granted';
        }

        let queryState: PermissionState = 'prompt';
        try {
            queryState = (await navigator.permissions.query({ name: deviceType as PermissionName }))?.state;
        } catch (err) {
            // Permissions API not supported — fall back to 'prompt'
        }

        if (queryState === 'granted') {
            dispatch(slice.actions.setPermissions({ [deviceType]: 'granted' }));
            return 'granted';
        }

        const start = performance.now();
        try {
            let stream: MediaStream;

            if (deviceType === 'microphone') {
                setAudioSessionType('auto');
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: !isAudioSessionAvailable() && deviceId ? { deviceId } : true,
                });
                setAudioSessionType('play-and-record');
            } else {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: deviceId ? { deviceId } : true,
                });
            }

            stream.getTracks().forEach((track) => track.stop());

            dispatch(slice.actions.setPermissions({ [deviceType]: 'granted' }));
            return 'granted';
        } catch (error) {
            const end = performance.now();
            // If the permission request takes less than 300ms, the browser is blocking the permission request.
            const arePermissionsBlocked = end - start < getAutoRejectThresholdMs();

            if (error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
                let actualState: PermissionState = 'denied';
                try {
                    actualState = (await navigator.permissions.query({ name: deviceType as PermissionName }))?.state;
                } catch {
                    // Permissions API not supported — fall back to 'denied'
                }
                dispatch(slice.actions.setPermissions({ [deviceType]: actualState }));

                if (arePermissionsBlocked) {
                    throw new PermissionBlockedError('Permissions are blocked by the browser');
                }

                return actualState;
            }

            dispatch(slice.actions.setPermissions({ [deviceType]: 'prompt' }));
            return 'prompt';
        }
    };

// Set the preferred device and persist the last used device id in local storage
export const setPreferredDeviceAndPersist =
    ({
        kind,
        deviceId,
    }: {
        kind: DeviceKind;
        deviceId: string | null;
    }): ThunkAction<void, MeetState, ProtonThunkArguments, UnknownAction> =>
    (dispatch) => {
        dispatch(slice.actions.setPreferredDevice({ kind, deviceId }));
        const lastUsedDeviceIdKey = getLastUsedDeviceIdKey(kind);

        if (deviceId) {
            setItem(lastUsedDeviceIdKey, deviceId);
        } else {
            removeItem(lastUsedDeviceIdKey);
        }
    };

export const {
    setPermissions,
    setDeviceList,
    setPreferredDevice,
    setActiveDevice,
    setInitialCameraState,
    setInitialAudioState,
    setUserCameraIntent,
    dismissPermissionsModal,
    showPermissionsModal,
    resetDeviceManagement,
} = slice.actions;

export const deviceManagementReducer = { deviceManagement: slice.reducer };
