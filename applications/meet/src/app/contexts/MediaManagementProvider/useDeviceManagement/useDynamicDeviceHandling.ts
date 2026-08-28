import { useEffect, useMemo, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { ConnectionState, type LocalTrack, MediaDeviceFailure, RoomEvent, Track } from 'livekit-client';
import debounce from 'lodash/debounce';

import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectFilteredCameras,
    selectFilteredMicrophones,
    selectFilteredSpeakers,
    selectMicrophoneState,
    selectPreferredCameraId,
    selectSpeakerState,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import type { DeviceKind } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { type SerializableDeviceInfo, isDefaultDevice } from '@proton/meet/utils/deviceUtils';

import { useStableCallback } from '../../../hooks/useStableCallback';
import type { SwitchActiveDevice, ToggleAudioType, ToggleVideoType } from '../../../types';
import { supportsSetSinkId } from '../../../utils/browser';

const DEVICE_CHANGE_DEBOUNCE_MS = 200;

const dynamicDeviceUpdate = ({
    kind,
    deviceList,
    deviceId,
    preferredDeviceId,
    systemDefaultDevice,
    previousSystemDefaultDeviceId,
    useSystemDefault,
    updateFunction,
}: {
    kind: DeviceKind;
    deviceList: SerializableDeviceInfo[];
    deviceId: string | null;
    preferredDeviceId: string | null;
    systemDefaultDevice: SerializableDeviceInfo | null;
    previousSystemDefaultDeviceId: string | null;
    useSystemDefault: boolean;
    updateFunction: (newDeviceId: string) => void;
}) => {
    const switchTo = (newDeviceId: string) => {
        // Avoid updating to the same device
        if (newDeviceId === deviceId) {
            return;
        }

        updateFunction(newDeviceId);
    };

    // Handle case where OS default device changed and user is using default option
    if (
        useSystemDefault &&
        previousSystemDefaultDeviceId &&
        systemDefaultDevice?.deviceId &&
        previousSystemDefaultDeviceId !== systemDefaultDevice.deviceId
    ) {
        switchTo(systemDefaultDevice.deviceId);
        return;
    }

    // Handle case where user plugs back device
    if (preferredDeviceId && deviceList.find((device) => device.deviceId === preferredDeviceId)) {
        switchTo(preferredDeviceId);
        return;
    }

    const currentDevice = deviceList.find((device) => device.deviceId === deviceId);

    // Handle case where user unplugs device
    if (!currentDevice && deviceList.length > 0 && !isDefaultDevice(deviceId)) {
        if (!systemDefaultDevice?.deviceId) {
            // Manage default device for video input because there is no system default for it.
            if (kind === 'videoinput') {
                switchTo(deviceList[0].deviceId);
            }
            return;
        }

        if (!deviceList.find((device) => device.deviceId === systemDefaultDevice.deviceId)) {
            switchTo(deviceList[0].deviceId);
            return;
        }

        switchTo(systemDefaultDevice.deviceId);
        return;
    }
};

interface UseDynamicDeviceHandlingParams {
    toggleVideo: ToggleVideoType;
    toggleAudio: ToggleAudioType;
    switchActiveDevice: SwitchActiveDevice;
}

export const useDynamicDeviceHandling = ({
    toggleAudio,
    toggleVideo,
    switchActiveDevice,
}: UseDynamicDeviceHandlingParams) => {
    const room = useRoomContext();
    const { reportMeetError } = useMeetErrorReporting();

    const filteredMicrophones = useMeetSelector(selectFilteredMicrophones);
    const filteredCameras = useMeetSelector(selectFilteredCameras);
    const filteredSpeakers = useMeetSelector(selectFilteredSpeakers);

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const preferredCameraId = useMeetSelector(selectPreferredCameraId);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    // Track previous system default device IDs to detect OS default device changes
    const previousSystemDefaultsRef = useRef<{
        microphone: string | null;
        speaker: string | null;
    }>({
        microphone: null,
        speaker: null,
    });

    // Initialize the previous system default device IDs because initial values are not available in the first render
    if (previousSystemDefaultsRef.current.microphone === null && microphoneState.systemDefault?.deviceId) {
        previousSystemDefaultsRef.current.microphone = microphoneState.systemDefault.deviceId;
    }
    if (previousSystemDefaultsRef.current.speaker === null && speakerState.systemDefault?.deviceId) {
        previousSystemDefaultsRef.current.speaker = speakerState.systemDefault.deviceId;
    }

    const handleMicrophoneListChange = useStableCallback(() => {
        dynamicDeviceUpdate({
            kind: 'audioinput',
            deviceList: filteredMicrophones,
            deviceId: activeMicrophoneDeviceId,
            preferredDeviceId: microphoneState.preferredDeviceId,
            systemDefaultDevice: microphoneState.systemDefault,
            previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.microphone,
            useSystemDefault: microphoneState.useSystemDefault,
            updateFunction: (newDeviceId: string) => {
                if (room.state === ConnectionState.Connected) {
                    void toggleAudio({ audioDeviceId: newDeviceId, preserveCache: true });
                } else {
                    void switchActiveDevice({
                        deviceType: 'audioinput',
                        deviceId: newDeviceId,
                        isSystemDefaultDevice: microphoneState.useSystemDefault,
                        preserveDefaultDevice: true,
                    });
                }
            },
        });

        previousSystemDefaultsRef.current.microphone = microphoneState.systemDefault?.deviceId ?? null;
    });

    const handleCameraListChange = useStableCallback(() => {
        dynamicDeviceUpdate({
            kind: 'videoinput',
            deviceList: filteredCameras,
            deviceId: activeCameraDeviceId,
            preferredDeviceId: preferredCameraId,
            systemDefaultDevice: null,
            previousSystemDefaultDeviceId: null,
            useSystemDefault: false,
            updateFunction: async (newDeviceId: string) => {
                if (room.state !== ConnectionState.Connected) {
                    void switchActiveDevice({
                        deviceType: 'videoinput',
                        deviceId: newDeviceId,
                        isSystemDefaultDevice: false,
                        preserveDefaultDevice: true,
                    });
                    return;
                }

                const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;

                // In case of unplugging a device, we need this extra cleanup if there was a background blur processor
                if (cameraTrack?.getProcessor()) {
                    await room.localParticipant.unpublishTrack(cameraTrack as LocalTrack);
                }

                void toggleVideo({ videoDeviceId: newDeviceId, preserveCache: true, updateUserIntent: false });
            },
        });
    });

    const handleSpeakerListChange = useStableCallback(() => {
        dynamicDeviceUpdate({
            kind: 'audiooutput',
            deviceList: filteredSpeakers,
            deviceId: activeAudioOutputDeviceId,
            preferredDeviceId: speakerState.preferredDeviceId,
            systemDefaultDevice: speakerState.systemDefault,
            previousSystemDefaultDeviceId: previousSystemDefaultsRef.current.speaker,
            useSystemDefault: speakerState.useSystemDefault,
            updateFunction: (newDeviceId: string) => {
                if (supportsSetSinkId()) {
                    void switchActiveDevice({
                        deviceType: 'audiooutput',
                        deviceId: newDeviceId,
                        isSystemDefaultDevice: speakerState.useSystemDefault,
                        preserveDefaultDevice: true,
                    });
                }
            },
        });

        previousSystemDefaultsRef.current.speaker = speakerState.systemDefault?.deviceId ?? null;
    });

    const debouncedMicrophoneListChange = useMemo(
        () => debounce(handleMicrophoneListChange, DEVICE_CHANGE_DEBOUNCE_MS, { leading: false, trailing: true }),
        [handleMicrophoneListChange]
    );

    const debouncedCameraListChange = useMemo(
        () => debounce(handleCameraListChange, DEVICE_CHANGE_DEBOUNCE_MS, { leading: false, trailing: true }),
        [handleCameraListChange]
    );

    const debouncedSpeakerListChange = useMemo(
        () => debounce(handleSpeakerListChange, DEVICE_CHANGE_DEBOUNCE_MS, { leading: false, trailing: true }),
        [handleSpeakerListChange]
    );

    useEffect(() => {
        if (!filteredMicrophones.length) {
            return;
        }

        debouncedMicrophoneListChange();

        return () => debouncedMicrophoneListChange.cancel();
    }, [filteredMicrophones, microphoneState.systemDefault?.deviceId, debouncedMicrophoneListChange]);

    useEffect(() => {
        if (!filteredCameras.length) {
            return;
        }

        debouncedCameraListChange();

        return () => debouncedCameraListChange.cancel();
    }, [filteredCameras, debouncedCameraListChange]);

    useEffect(() => {
        if (!filteredSpeakers.length) {
            return;
        }

        debouncedSpeakerListChange();

        return () => debouncedSpeakerListChange.cancel();
    }, [filteredSpeakers, speakerState.systemDefault?.deviceId, debouncedSpeakerListChange]);

    // Report to sentry when livekit has device errors
    // https://docs.livekit.io/reference/client-sdk-js/enums/RoomEvent.html#mediadeviceserror
    useEffect(() => {
        const handleMediaDevicesError = (error: Error, kind: MediaDeviceKind | undefined) => {
            const failure = MediaDeviceFailure.getFailure(error) ?? 'Unknown';

            reportMeetError(`Livekit MediaDevicesError ${failure}`, {
                error: error,
                tags: {
                    failure,
                    mediaDeviceKind: kind,
                },
            });
        };

        room.on(RoomEvent.MediaDevicesError, handleMediaDevicesError);

        return () => {
            room.off(RoomEvent.MediaDevicesError, handleMediaDevicesError);
        };
    }, [reportMeetError, room]);
};
