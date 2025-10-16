import { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaDeviceSelect, useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useAudioToggle } from '../hooks/useAudioToggle';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useDevices } from '../hooks/useDevices';
import { useDynamicDeviceHandling } from '../hooks/useDynamicDeviceHandling';
import { useVideoToggle } from '../hooks/useVideoToggle';
import type { SwitchActiveDevice } from '../types';
import { saveAudioDevice, saveAudioOutputDevice, saveVideoDevice } from '../utils/deviceStorage';
import { MediaManagementContext } from './MediaManagementContext';

export const MediaManagementProvider = ({ children }: { children: React.ReactNode }) => {
    const room = useRoomContext();

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

    const { microphones, cameras, speakers, defaultCamera, defaultMicrophone, defaultSpeaker } = useDevices();
    const [devicePermissions, setDevicePermissions] = useState<{
        camera?: PermissionState;
        microphone?: PermissionState;
    }>({
        camera: 'prompt',
        microphone: 'prompt',
    });

    const switchActiveDevice: SwitchActiveDevice = useCallback(
        (deviceType, deviceId) => {
            void room.switchActiveDevice(deviceType, deviceId);

            if (deviceType === 'videoinput') {
                saveVideoDevice(deviceId);
            } else if (deviceType === 'audioinput') {
                saveAudioDevice(deviceId);
            } else if (deviceType === 'audiooutput') {
                saveAudioOutputDevice(deviceId);
            }
        },
        [room]
    );

    const { toggleVideo, handleRotateCamera, backgroundBlur, toggleBackgroundBlur, isVideoEnabled, facingMode } =
        useVideoToggle(activeCameraDeviceId, switchActiveDevice, initialCameraState);

    const { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled } = useAudioToggle(
        activeMicrophoneDeviceId,
        switchActiveDevice,
        initialAudioState
    );

    const handleDevicePermissionChange = (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
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
    });

    const initializedDevices = useRef({
        video: false,
        audio: false,
        audioOutput: false,
    });

    useEffect(() => {
        if (!initializedDevices.current.video && defaultCamera?.deviceId) {
            void switchActiveDevice('videoinput', defaultCamera?.deviceId);
            initializedDevices.current.video = true;
        }

        if (!initializedDevices.current.audio && defaultMicrophone?.deviceId) {
            void switchActiveDevice('audioinput', defaultMicrophone?.deviceId);
            initializedDevices.current.audio = true;
        }

        if (!initializedDevices.current.audioOutput && defaultSpeaker?.deviceId) {
            void switchActiveDevice('audiooutput', defaultSpeaker?.deviceId);
            initializedDevices.current.audioOutput = true;
        }
    }, [switchActiveDevice, defaultCamera?.deviceId, defaultMicrophone?.deviceId, defaultSpeaker?.deviceId]);

    return (
        <MediaManagementContext.Provider
            value={{
                devicePermissions,
                setDevicePermissions,
                microphones,
                cameras,
                speakers,
                defaultCamera,
                defaultMicrophone,
                defaultSpeaker,
                selectedCameraId: activeCameraDeviceId,
                selectedMicrophoneId: activeMicrophoneDeviceId,
                selectedAudioOutputDeviceId: activeAudioOutputDeviceId,
                isVideoEnabled,
                isAudioEnabled,
                facingMode,
                toggleVideo,
                toggleAudio,
                backgroundBlur,
                toggleBackgroundBlur,
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
