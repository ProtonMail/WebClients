import { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaDeviceSelect, useRoomContext } from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useAudioToggle } from '../hooks/useAudioToggle';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useDevices } from '../hooks/useDevices';
import { useDynamicDeviceHandling } from '../hooks/useDynamicDeviceHandling';
import { useVideoToggle } from '../hooks/useVideoToggle';
import type { SwitchActiveDevice } from '../types';
import { MediaManagementContext } from './MediaManagementContext';
import { useStoredDevices } from './StoredDevicesContext';

export const MediaManagementProvider = ({ children }: { children: React.ReactNode }) => {
    const room = useRoomContext();
    const { saveAudioDevice, saveVideoDevice, saveAudioOutputDevice } = useStoredDevices();

    const [initialCameraState, setInitialCameraState] = useState<boolean>(false);
    const [initialAudioState, setInitialAudioState] = useState<boolean>(false);

    const { activeDeviceId: activeMicrophoneDeviceId } = useMediaDeviceSelect({
        kind: 'audioinput',
    });
    const { activeDeviceId: activeAudioOutputDeviceId } = useMediaDeviceSelect({
        kind: 'audiooutput',
    });
    const { activeDeviceId: activeCameraDeviceId } = useMediaDeviceSelect({
        kind: 'videoinput',
    });

    const {
        microphones,
        cameras,
        speakers,
        defaultCamera,
        defaultMicrophone,
        defaultSpeaker,
        cameraState,
        microphoneState,
        speakerState,
        getDefaultDevice,
    } = useDevices();
    const [devicePermissions, setDevicePermissions] = useState<{
        camera?: PermissionState;
        microphone?: PermissionState;
    }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const switchActiveDevice: SwitchActiveDevice = useCallback(
        async ({ deviceType, deviceId, isSystemDefaultDevice, preserveDefaultDevice = false }) => {
            await room.switchActiveDevice(deviceType, deviceId);

            if (preserveDefaultDevice) {
                return;
            }

            const toSave = isSystemDefaultDevice ? null : deviceId;
            if (deviceType === 'videoinput') {
                saveVideoDevice(toSave);
            } else if (deviceType === 'audioinput') {
                saveAudioDevice(toSave);
            } else if (deviceType === 'audiooutput') {
                saveAudioOutputDevice(toSave);
            }
        },
        [room, saveAudioDevice, saveVideoDevice, saveAudioOutputDevice]
    );

    const {
        toggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur,
        isVideoEnabled,
        facingMode,
        isBackgroundBlurSupported,
    } = useVideoToggle(activeCameraDeviceId, switchActiveDevice, initialCameraState, cameraState.systemDefault!);

    const { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled } = useAudioToggle(
        activeMicrophoneDeviceId,
        switchActiveDevice,
        initialAudioState,
        microphoneState.systemDefault!
    );

    const handleDevicePermissionChange = (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
        if (permissions.camera === 'denied') {
            if (room.state === ConnectionState.Connected) {
                void room.localParticipant.setCameraEnabled(false);
            } else {
                setInitialCameraState(false);
            }
        }
        if (permissions.microphone === 'denied') {
            if (room.state === ConnectionState.Connected) {
                void room.localParticipant.setMicrophoneEnabled(false);
            } else {
                setInitialAudioState(false);
            }
        }
        setDevicePermissions((prevPermissions) => ({ ...prevPermissions, ...permissions }));
    };

    const initializeDevices = async () => {
        await Promise.all([
            room.localParticipant.setCameraEnabled(initialCameraState, isMobile() ? { facingMode } : undefined),
            room.localParticipant.setMicrophoneEnabled(initialAudioState),
        ]);

        // We need to restart the video track on mobile to make sure the facing mode is applied
        if (isMobile() && initialCameraState) {
            const videoTrack = [...room.localParticipant.trackPublications.values()].filter(
                (track) => track.kind === Track.Kind.Video && track.source !== Track.Source.ScreenShare
            )[0]?.track;

            if (videoTrack) {
                await videoTrack.restartTrack({ facingMode: { exact: facingMode } });
            }
        }
    };

    useDevicePermissionChangeListener(handleDevicePermissionChange, activeCameraDeviceId);

    useDynamicDeviceHandling({
        toggleAudio,
        toggleVideo,
        activeMicrophoneDeviceId,
        activeAudioOutputDeviceId,
        activeCameraDeviceId,
        switchActiveDevice,
        cameraState,
        microphoneState,
        speakerState,
        getDefaultDevice,
    });

    const initializedDevices = useRef({
        video: false,
        audio: false,
        audioOutput: false,
    });

    useEffect(() => {
        if (!initializedDevices.current.video && defaultCamera?.deviceId) {
            void switchActiveDevice({
                deviceType: 'videoinput',
                deviceId: defaultCamera.deviceId,
                isSystemDefaultDevice: cameraState.useSystemDefault,
            });
            initializedDevices.current.video = true;
        }

        if (!initializedDevices.current.audio && defaultMicrophone?.deviceId) {
            void switchActiveDevice({
                deviceType: 'audioinput',
                deviceId: defaultMicrophone.deviceId,
                isSystemDefaultDevice: microphoneState.useSystemDefault,
            });
            initializedDevices.current.audio = true;
        }

        if (!initializedDevices.current.audioOutput && defaultSpeaker?.deviceId) {
            void switchActiveDevice({
                deviceType: 'audiooutput',
                deviceId: defaultSpeaker.deviceId,
                isSystemDefaultDevice: speakerState.useSystemDefault,
            });
            initializedDevices.current.audioOutput = true;
        }
    }, [switchActiveDevice, defaultCamera?.deviceId, defaultMicrophone?.deviceId, defaultSpeaker?.deviceId]);

    return (
        <MediaManagementContext.Provider
            value={{
                devicePermissions,
                handleDevicePermissionChange,
                microphones,
                cameras,
                speakers,
                defaultCamera,
                defaultMicrophone,
                defaultSpeaker,
                cameraState,
                microphoneState,
                speakerState,
                selectedCameraId: defaultCamera?.deviceId ?? activeCameraDeviceId,
                selectedMicrophoneId: defaultMicrophone?.deviceId ?? activeMicrophoneDeviceId,
                selectedAudioOutputDeviceId: defaultSpeaker?.deviceId ?? activeAudioOutputDeviceId,
                isVideoEnabled,
                isAudioEnabled,
                facingMode,
                toggleVideo,
                toggleAudio,
                backgroundBlur,
                toggleBackgroundBlur,
                isBackgroundBlurSupported,
                noiseFilter,
                toggleNoiseFilter,
                handleRotateCamera,
                initialCameraState,
                initialAudioState,
                setInitialCameraState,
                setInitialAudioState,
                switchActiveDevice,
                initializeDevices,
            }}
        >
            {children}
        </MediaManagementContext.Provider>
    );
};
