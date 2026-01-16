import { useCallback, useEffect, useRef, useState } from 'react';

import { useMediaDeviceSelect, useRoomContext } from '@livekit/components-react';
import type { LocalTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useAudioToggle } from '../hooks/useAudioToggle';
import { useDevicePermissionChangeListener } from '../hooks/useDevicePermissionChangeListener';
import { useDevices } from '../hooks/useDevices';
import { useDynamicDeviceHandling } from '../hooks/useDynamicDeviceHandling';
import { useMicrophoneVolumeAnalysis } from '../hooks/useMicrophoneVolumeAnalysis';
import { useVideoToggle } from '../hooks/useVideoToggle';
import type { SwitchActiveDevice } from '../types';
import { supportsSetSinkId } from '../utils/browser';
import { setAudioSessionType } from '../utils/ios-audio-session';
import { MediaManagementContext } from './MediaManagementContext';

export const MediaManagementProvider = ({ children }: { children: React.ReactNode }) => {
    const room = useRoomContext();
    const { createNotification } = useNotifications();
    const reportMeetError = useMeetErrorReporting();

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

    const { getMicrophoneVolumeAnalysis, initializeMicrophoneVolumeAnalysis, cleanupMicrophoneVolumeAnalysis } =
        useMicrophoneVolumeAnalysis();

    const switchActiveDevice: SwitchActiveDevice = useCallback(
        async ({ deviceType, deviceId, isSystemDefaultDevice, preserveDefaultDevice = false }) => {
            if ((deviceType === 'audiooutput' && !supportsSetSinkId()) || isMobile()) {
                return;
            }

            try {
                await room.switchActiveDevice(deviceType, deviceId);
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

    const initializeCamera = async (initialCameraState: boolean) => {
        try {
            if (initialCameraState) {
                await toggleVideo({ isEnabled: true, preserveCache: true });
            }
        } catch (error) {
            reportMeetError('Failed to initialize camera', error);
            throw error;
        }
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
            } else {
                await toggleAudio({ isEnabled: true, preserveCache: true });
            }
        } catch (error) {
            reportMeetError('Failed to initialize microphone', error);
            throw error;
        }
    };

    const initializeDevices = async () => {
        await cleanupMicrophoneVolumeAnalysis();

        const results = await Promise.allSettled([
            initializeCamera(initialCameraState),
            initializeMicrophone(initialAudioState),
        ]);

        const cameraError = results[0].status === 'rejected' ? results[0].reason : null;
        const microphoneError = results[1].status === 'rejected' ? results[1].reason : null;

        if (cameraError || microphoneError) {
            if (cameraError) {
                reportMeetError('Failed to initialize camera', cameraError);
            }
            if (microphoneError) {
                reportMeetError('Failed to initialize microphone', microphoneError);
            }

            let errorMessage: string;
            if (cameraError && microphoneError) {
                errorMessage = c('Warning')
                    .t`Could not access camera or microphone. You can try enabling them again from the meeting controls.`;
            } else if (cameraError) {
                errorMessage = c('Warning')
                    .t`Could not access camera. You can try enabling it again from the meeting controls.`;
            } else {
                errorMessage = c('Warning')
                    .t`Could not access microphone. You can try enabling it again from the meeting controls.`;
            }

            createNotification({
                type: 'warning',
                text: errorMessage,
            });
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

    useEffect(() => {
        const wasConnectedRef = { current: false };
        const cleanupInProgressRef = { current: false };

        const handleCleanup = async () => {
            if (cleanupInProgressRef.current) {
                return;
            }

            cleanupInProgressRef.current = true;

            const localParticipant = room.localParticipant;

            try {
                await Promise.allSettled([
                    localParticipant.setScreenShareEnabled(false),
                    localParticipant.setCameraEnabled(false),
                    localParticipant.setMicrophoneEnabled(false),
                ]);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }

            const tracks = [...localParticipant.trackPublications.values()]
                .map((pub) => pub.track)
                .filter((track): track is LocalTrack => !!track);

            tracks.forEach((track) => {
                try {
                    track.stop();
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                }
            });

            cleanupInProgressRef.current = false;
        };

        const handleConnected = () => {
            wasConnectedRef.current = true;
        };

        const handleDisconnected = () => {
            if (!wasConnectedRef.current) {
                return;
            }

            wasConnectedRef.current = false;
            void handleCleanup();
        };

        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        return () => {
            room.off(RoomEvent.Connected, handleConnected);
            room.off(RoomEvent.Disconnected, handleDisconnected);

            void handleCleanup();
        };
    }, []);

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
                getMicrophoneVolumeAnalysis,
                initializeMicrophoneVolumeAnalysis,
                cleanupMicrophoneVolumeAnalysis,
            }}
        >
            {children}
        </MediaManagementContext.Provider>
    );
};
