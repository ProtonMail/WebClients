import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';
import { c } from 'ttag';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { isLinux, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';

import { type SerializableDeviceInfo, getDefaultDevice } from '../../utils/deviceUtils';
import { isAudioSessionAvailable, setAudioSessionType } from '../../utils/iosAudioSession';
import type { MeetState } from '../rootReducer';

export enum PermissionsModalType {
    NONE = 'none',
    PERMISSIONS_MODAL = 'permissionsModal',
    PERMISSIONS_BLOCKED_MODAL = 'permissionsBlockedModal',
    PERMISSIONS_BLOCKED_CAMERA_MODAL = 'permissionsBlockedCameraModal',
    PERMISSIONS_BLOCKED_MICROPHONE_MODAL = 'permissionsBlockedMicrophoneModal',
    PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL = 'permissionsBlockedScreenShareModal',
}

export interface DeviceManagementState {
    permissions: {
        camera: PermissionState;
        microphone: PermissionState;
    };
    cameras: SerializableDeviceInfo[];
    microphones: SerializableDeviceInfo[];
    speakers: SerializableDeviceInfo[];
    preferredCameraId: string | null;
    preferredMicrophoneId: string | null;
    preferredSpeakerId: string | null;
    activeCameraId: string;
    activeMicrophoneId: string;
    activeAudioOutputId: string;
    initialCameraState: boolean;
    initialAudioState: boolean;
    uiModals: {
        permissionsModal: PermissionsModalType;
    };
}

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
    uiModals: {
        permissionsModal: PermissionsModalType.NONE,
    },
};

type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

const slice = createSlice({
    name: 'deviceManagement',
    initialState: deviceManagementInitialState,
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

export const selectDeviceManagement = (state: MeetState) => state.deviceManagement;

export const selectCameraPermission = (state: MeetState) => state.deviceManagement.permissions.camera;
export const selectMicrophonePermission = (state: MeetState) => state.deviceManagement.permissions.microphone;
export const selectPermissions = (state: MeetState) => state.deviceManagement.permissions;

export const selectCameras = (state: MeetState) => state.deviceManagement.cameras;
export const selectMicrophones = (state: MeetState) => state.deviceManagement.microphones;
export const selectSpeakers = (state: MeetState) => state.deviceManagement.speakers;

export const selectPreferredCameraId = (state: MeetState) => state.deviceManagement.preferredCameraId;
export const selectPreferredMicrophoneId = (state: MeetState) => state.deviceManagement.preferredMicrophoneId;
export const selectPreferredSpeakerId = (state: MeetState) => state.deviceManagement.preferredSpeakerId;

export const selectActiveCameraId = (state: MeetState) => state.deviceManagement.activeCameraId;
export const selectActiveMicrophoneId = (state: MeetState) => state.deviceManagement.activeMicrophoneId;
export const selectActiveAudioOutputId = (state: MeetState) => state.deviceManagement.activeAudioOutputId;

export const selectInitialCameraState = (state: MeetState) => state.deviceManagement.initialCameraState;
export const selectInitialAudioState = (state: MeetState) => state.deviceManagement.initialAudioState;

export const selectPermissionsModals = (state: MeetState) => state.deviceManagement.uiModals;

const isDeviceAvailable = (devices: SerializableDeviceInfo[], deviceId: string | null): boolean =>
    !!devices.find((d) => d.deviceId === deviceId);

export const selectSelectedCameraId = createSelector(
    [selectCameras, selectPreferredCameraId, selectActiveCameraId],
    (cameras, preferredId, activeId) => {
        if (preferredId && isDeviceAvailable(cameras, preferredId)) {
            return preferredId;
        }
        return activeId;
    }
);

export const selectSelectedMicrophoneId = createSelector(
    [selectMicrophones, selectPreferredMicrophoneId, selectActiveMicrophoneId],
    (microphones, preferredId, activeId) => {
        if (preferredId && isDeviceAvailable(microphones, preferredId)) {
            return preferredId;
        }
        return activeId;
    }
);

export const selectSelectedAudioOutputId = createSelector(
    [selectSpeakers, selectPreferredSpeakerId, selectActiveAudioOutputId],
    (speakers, preferredId, activeId) => {
        if (preferredId && isDeviceAvailable(speakers, preferredId)) {
            return preferredId;
        }
        return activeId;
    }
);

const getDefaultLabel = (systemDefault: SerializableDeviceInfo | null) =>
    systemDefault && !isLinux() ? c('Info').t`Default - ${systemDefault.label}` : c('Info').t`Default - System Default`;

const getDeviceFromList = (
    devices: SerializableDeviceInfo[],
    deviceId: string | null
): SerializableDeviceInfo | null => {
    if (!deviceId) {
        return null;
    }
    return devices.find((d) => d.deviceId === deviceId) ?? null;
};

export interface SliceDeviceState {
    systemDefault: SerializableDeviceInfo | null;
    systemDefaultLabel: string;
    useSystemDefault: boolean;
    preferredAvailable: boolean;
    preferredDevice: SerializableDeviceInfo | null;
    preferredDeviceId: string | null;
}

const getDeviceState = (devices: SerializableDeviceInfo[], preferredId: string | null): SliceDeviceState => {
    const systemDefault = getDefaultDevice(devices);

    return {
        systemDefault,
        systemDefaultLabel: getDefaultLabel(systemDefault),
        useSystemDefault: preferredId === null,
        preferredAvailable: isDeviceAvailable(devices, preferredId),
        preferredDevice: getDeviceFromList(devices, preferredId),
        preferredDeviceId: preferredId,
    };
};

export const selectCameraState = createSelector(
    [selectCameras, selectPreferredCameraId],
    (cameras, preferredId): SliceDeviceState => getDeviceState(cameras, preferredId)
);

export const selectMicrophoneState = createSelector(
    [selectMicrophones, selectPreferredMicrophoneId],
    (microphones, preferredId): SliceDeviceState => getDeviceState(microphones, preferredId)
);

export const selectSpeakerState = createSelector(
    [selectSpeakers, selectPreferredSpeakerId],
    (speakers, preferredId): SliceDeviceState => getDeviceState(speakers, preferredId)
);

export const {
    setPermissions,
    setDeviceList,
    setPreferredDevice,
    setActiveDevice,
    setInitialCameraState,
    setInitialAudioState,
    dismissPermissionsModal,
    showPermissionsModal,
    resetDeviceManagement,
} = slice.actions;

export const deviceManagementReducer = { deviceManagement: slice.reducer };
