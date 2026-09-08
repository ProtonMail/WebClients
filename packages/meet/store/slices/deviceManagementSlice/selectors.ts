import { createSelector } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { isLinux } from '@proton/shared/lib/helpers/browser';

import {
    type SerializableDeviceInfo,
    filterDevices,
    getDefaultDevice,
    getDevicesHash,
    isDefaultDevice,
    toSerializableDevice,
} from '../../../utils/deviceUtils';
import type { MeetState } from '../../rootReducer';
import type { MeetStore } from '../../store';
import type { SliceDeviceState } from './types';

export const selectCameraPermission = (state: MeetState) => state.deviceManagement.permissions.camera;
export const selectMicrophonePermission = (state: MeetState) => state.deviceManagement.permissions.microphone;

export const selectCameras = (state: MeetState) => state.deviceManagement.cameras;
export const selectMicrophones = (state: MeetState) => state.deviceManagement.microphones;
export const selectSpeakers = (state: MeetState) => state.deviceManagement.speakers;

const sortDevices = (devices: SerializableDeviceInfo[]) =>
    [...devices].sort((a, b) => {
        return a.label.localeCompare(b.label);
    });

const checkDeviceListEquality = {
    memoizeOptions: {
        resultEqualityCheck: (a: SerializableDeviceInfo[], b: SerializableDeviceInfo[]) =>
            getDevicesHash(a) === getDevicesHash(b),
    },
};

export const selectFilteredCameras = createSelector([selectCameras], filterDevices, checkDeviceListEquality);
export const selectSortedFilteredCameras = createSelector([selectFilteredCameras], sortDevices);

export const selectFilteredMicrophones = createSelector([selectMicrophones], filterDevices, checkDeviceListEquality);
export const selectSortedFilteredMicrophones = createSelector([selectFilteredMicrophones], sortDevices);

export const selectFilteredSpeakers = createSelector([selectSpeakers], filterDevices, checkDeviceListEquality);
export const selectSortedFilteredSpeakers = createSelector([selectFilteredSpeakers], sortDevices);

// Get the devices from the media devices API, fallback to the store if the API is not supported
// Prevent us to use stale devices when plugging/unplugging them, array is not memoized
export const selectRealtimeDevices = async (store: MeetStore, kind: 'audioinput' | 'audiooutput' | 'videoinput') => {
    try {
        return (await navigator.mediaDevices.enumerateDevices())
            .filter((d) => d.kind === kind && d.deviceId !== '')
            .map(toSerializableDevice);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[selectRealtimeDevices] error getting realtime devices, falling back to redux store', error);

        switch (kind) {
            case 'audioinput':
                return store.getState().deviceManagement.microphones;
            case 'audiooutput':
                return store.getState().deviceManagement.speakers;
            case 'videoinput':
                return store.getState().deviceManagement.cameras;
        }
    }
};

export const selectPreferredCameraId = (state: MeetState) => state.deviceManagement.preferredCameraId;
export const selectPreferredMicrophoneId = (state: MeetState) => state.deviceManagement.preferredMicrophoneId;
export const selectPreferredSpeakerId = (state: MeetState) => state.deviceManagement.preferredSpeakerId;

export const selectActiveCameraId = (state: MeetState) => state.deviceManagement.activeCameraId;
export const selectActiveMicrophoneId = (state: MeetState) => state.deviceManagement.activeMicrophoneId;
export const selectActiveAudioOutputId = (state: MeetState) => state.deviceManagement.activeAudioOutputId;

export const selectInitialCameraState = (state: MeetState) => state.deviceManagement.initialCameraState;
export const selectInitialAudioState = (state: MeetState) => state.deviceManagement.initialAudioState;
export const selectUserCameraIntent = (state: MeetState) => state.deviceManagement.userCameraIntent;
export const selectIsMediaInitializing = (state: MeetState) => state.deviceManagement.isMediaInitializing;

export const selectPermissionsModals = (state: MeetState) => state.deviceManagement.uiModals;

const isDeviceAvailable = (devices: SerializableDeviceInfo[], deviceId: string | null): boolean =>
    !!devices.find((d) => d.deviceId === deviceId);

// What is in use right now, falling back to the saved preference while nothing is in use yet
const resolveSelectedDeviceId = (devices: SerializableDeviceInfo[], preferredId: string | null, activeId: string) => {
    if (isDeviceAvailable(devices, activeId)) {
        return activeId;
    }
    if (preferredId && isDeviceAvailable(devices, preferredId)) {
        return preferredId;
    }
    return activeId;
};

export const selectSelectedCameraId = createSelector(
    [selectCameras, selectPreferredCameraId, selectActiveCameraId],
    resolveSelectedDeviceId
);

export const selectSelectedMicrophoneId = createSelector(
    [selectMicrophones, selectPreferredMicrophoneId, selectActiveMicrophoneId],
    resolveSelectedDeviceId
);

export const selectSelectedAudioOutputId = createSelector(
    [selectSpeakers, selectPreferredSpeakerId, selectActiveAudioOutputId],
    resolveSelectedDeviceId
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

const getDeviceState = (devices: SerializableDeviceInfo[], preferredId: string | null): SliceDeviceState => {
    const systemDefault = getDefaultDevice(devices);

    return {
        systemDefault,
        systemDefaultLabel: getDefaultLabel(systemDefault),
        hasDefaultOption: devices.some((d) => isDefaultDevice(d.deviceId)),
        useSystemDefault: preferredId === null,
        preferredAvailable: isDeviceAvailable(devices, preferredId),
        preferredDevice: getDeviceFromList(devices, preferredId),
        preferredDeviceId: preferredId,
    };
};

export const selectMicrophoneState = createSelector(
    [selectMicrophones, selectPreferredMicrophoneId],
    (microphones, preferredId): SliceDeviceState => getDeviceState(microphones, preferredId)
);

export const selectSpeakerState = createSelector(
    [selectSpeakers, selectPreferredSpeakerId],
    (speakers, preferredId): SliceDeviceState => getDeviceState(speakers, preferredId)
);
