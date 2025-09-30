import { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaDeviceSelect, useRoomContext } from '@livekit/components-react';

import { useAudioToggle } from '../hooks/useAudioToggle';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useDevices } from '../hooks/useDevices';
import { useDynamicDeviceHandling } from '../hooks/useDynamicDeviceHandling';
import { useVideoToggle } from '../hooks/useVideoToggle';
import type { SwitchActiveDevice } from '../types';
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
        },
        [room]
    );

    const { toggleVideo, handleRotateCamera, backgroundBlur, toggleBackgroundBlur, isVideoEnabled } = useVideoToggle(
        activeCameraDeviceId,
        switchActiveDevice
    );
    const { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled } = useAudioToggle(
        activeMicrophoneDeviceId,
        switchActiveDevice
    );

    const handleDevicePermissionChange = (permissions: { camera?: PermissionState; microphone?: PermissionState }) => {
        setDevicePermissions((prevPermissions) => ({ ...prevPermissions, ...permissions }));
    };

    const initializeAudioAndVideo = async () => {
        await Promise.all([
            toggleVideo({ isEnabled: initialCameraState, videoDeviceId: activeCameraDeviceId }),
            toggleAudio({ isEnabled: initialAudioState, audioDeviceId: activeMicrophoneDeviceId }),
        ]);
    };

    useDevicePermissionChangeListener(handleDevicePermissionChange);

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
                initializeAudioAndVideo,
            }}
        >
            {children}
        </MediaManagementContext.Provider>
    );
};
