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
import { supportsSetSinkId } from '../utils/browser';
import { setAudioSessionType } from '../utils/ios-audio-session';
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

    const {
        microphones,
        cameras,
        speakers,
        cameraState,
        microphoneState,
        speakerState,
        setPreferredDevice,
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
            if ((deviceType === 'audiooutput' && !supportsSetSinkId()) || isMobile()) {
                return;
            }

            try {
                void room.switchActiveDevice(deviceType, deviceId);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                return;
            }

            if (preserveDefaultDevice) {
                return;
            }

            const toSave = isSystemDefaultDevice ? null : deviceId;
            setPreferredDevice(toSave, deviceType);
        },
        [room, setPreferredDevice]
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

    const initializeMicrophone = async (initialAudioState: boolean) => {
        try {
            setAudioSessionType('auto');

            // Always create and publish the track for faster unmuting
            const audioConstraints = {
                autoGainControl: true,
                echoCancellation: true,
                noiseSuppression: true,
            };

            await room.localParticipant.setMicrophoneEnabled(true, audioConstraints);
            setAudioSessionType('play-and-record');

            // If starting muted, mute the track (keeps it published but silent)
            if (!initialAudioState) {
                const audioPublication = [...room.localParticipant.audioTrackPublications.values()].find(
                    (pub) => pub.kind === Track.Kind.Audio && pub.source !== Track.Source.ScreenShare
                );

                if (audioPublication?.track) {
                    await audioPublication.track.mute();
                }
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    };

    const initializeDevices = async () => {
        await Promise.all([
            room.localParticipant.setCameraEnabled(initialCameraState, isMobile() ? { facingMode } : undefined),
            initializeMicrophone(initialAudioState),
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
        if (!initializedDevices.current.video && cameraState.preferredDevice?.deviceId) {
            void switchActiveDevice({
                deviceType: 'videoinput',
                deviceId: cameraState.preferredDevice.deviceId,
                isSystemDefaultDevice: cameraState.useSystemDefault,
            });
            initializedDevices.current.video = true;
        }

        if (!initializedDevices.current.audio && microphoneState.preferredDevice?.deviceId) {
            void switchActiveDevice({
                deviceType: 'audioinput',
                deviceId: microphoneState.preferredDevice.deviceId,
                isSystemDefaultDevice: microphoneState.useSystemDefault,
            });
            initializedDevices.current.audio = true;
        }

        if (!initializedDevices.current.audioOutput && speakerState.preferredDevice?.deviceId) {
            void switchActiveDevice({
                deviceType: 'audiooutput',
                deviceId: speakerState.preferredDevice.deviceId,
                isSystemDefaultDevice: speakerState.useSystemDefault,
            });
            initializedDevices.current.audioOutput = true;
        }
    }, [
        switchActiveDevice,
        cameraState.preferredDevice?.deviceId,
        microphoneState.preferredDevice?.deviceId,
        speakerState.preferredDevice?.deviceId,
    ]);

    return (
        <MediaManagementContext.Provider
            value={{
                devicePermissions,
                handleDevicePermissionChange,
                microphones,
                cameras,
                speakers,
                defaultCamera: cameraState.preferredDevice,
                defaultMicrophone: microphoneState.preferredDevice,
                defaultSpeaker: speakerState.preferredDevice,
                cameraState,
                microphoneState,
                speakerState,
                selectedCameraId: cameraState.preferredDevice?.deviceId ?? activeCameraDeviceId,
                selectedMicrophoneId: microphoneState.preferredDevice?.deviceId ?? activeMicrophoneDeviceId,
                selectedAudioOutputDeviceId: speakerState.preferredDevice?.deviceId ?? activeAudioOutputDeviceId,
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
