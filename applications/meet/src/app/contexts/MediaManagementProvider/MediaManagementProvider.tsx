import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { LocalTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectCameraPermission,
    selectCameraState,
    selectInitialAudioState,
    selectInitialCameraState,
    selectMicrophonePermission,
    selectMicrophoneState,
    selectPreferredCameraId,
    selectPreferredMicrophoneId,
    selectPreferredSpeakerId,
    selectSelectedAudioOutputId,
    selectSelectedCameraId,
    selectSelectedMicrophoneId,
    selectSpeakerState,
    setInitialAudioState,
    setInitialCameraState,
    setPreferredDevice,
} from '@proton/meet/store/slices/deviceManagementSlice';
import { setAudioSessionType } from '@proton/meet/utils/iosAudioSession';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useDeviceData } from '../../hooks/bridges/useDeviceData';
import { useStableCallback } from '../../hooks/useStableCallback';
import { preloadBackgroundProcessorAssets } from '../../processors/background-processor/createBackgroundProcessor';
import type { SwitchActiveDevice } from '../../types';
import { supportsSetSinkId } from '../../utils/browser';
import { MediaManagementContext } from './MediaManagementContext';
import { PermissionsModal } from './PermissionsModal/PermissionsModal';
import { useAudioToggle } from './mediaToggle/useAudioToggle';
import { useVideoToggle } from './mediaToggle/useVideoToggle';
import { useCameraPreview } from './useCameraPreview';
import { useDevicePermissionChangeListener } from './useDevicePermissionChangeListener';
import { useDynamicDeviceHandling } from './useDynamicDeviceHandling';
import { useMicrophoneVolumeAnalysis } from './useMicrophoneVolumeAnalysis';

export const MediaManagementProvider = ({
    children,
    krispAudioContext,
}: {
    children: React.ReactNode;
    krispAudioContext: AudioContext | undefined;
}) => {
    const room = useRoomContext();
    const { createNotification } = useNotifications();
    const { reportMeetError } = useMeetErrorReporting();
    const dispatch = useMeetDispatch();

    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const initialAudioState = useMeetSelector(selectInitialAudioState);

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const selectedCameraId = useMeetSelector(selectSelectedCameraId);
    const selectedMicrophoneId = useMeetSelector(selectSelectedMicrophoneId);
    const selectedAudioOutputDeviceId = useMeetSelector(selectSelectedAudioOutputId);

    const cameraState = useMeetSelector(selectCameraState);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    const preferredCameraId = useMeetSelector(selectPreferredCameraId);
    const preferredMicrophoneId = useMeetSelector(selectPreferredMicrophoneId);
    const preferredSpeakerId = useMeetSelector(selectPreferredSpeakerId);

    const { getMicrophoneVolumeAnalysis, initializeMicrophoneVolumeAnalysis, cleanupMicrophoneVolumeAnalysis } =
        useMicrophoneVolumeAnalysis();

    const switchActiveDevice: SwitchActiveDevice = useCallback(
        async ({ deviceType, deviceId, isSystemDefaultDevice, preserveDefaultDevice = false }) => {
            if ((deviceType === 'audiooutput' && !supportsSetSinkId()) || isMobile()) {
                return;
            }

            const activeDeviceIdByType: Record<'audioinput' | 'audiooutput' | 'videoinput', string> = {
                audioinput: activeMicrophoneDeviceId,
                audiooutput: activeAudioOutputDeviceId,
                videoinput: activeCameraDeviceId,
            };
            const currentActiveDeviceId = activeDeviceIdByType[deviceType];
            const shouldCallLiveKitSwitch = currentActiveDeviceId !== deviceId;

            try {
                if (shouldCallLiveKitSwitch) {
                    await room.switchActiveDevice(deviceType, deviceId);
                }
            } catch (error) {
                reportMeetError('Failed to switch active device', error);
                // eslint-disable-next-line no-console
                console.error(error);
                return;
            }

            if (preserveDefaultDevice) {
                return;
            }

            const toSave = isSystemDefaultDevice ? null : deviceId;
            dispatch(setPreferredDevice({ kind: deviceType, deviceId: toSave }));
        },
        [activeAudioOutputDeviceId, activeCameraDeviceId, activeMicrophoneDeviceId, room, dispatch]
    );

    const {
        toggleVideo,
        handleRotateCamera,
        backgroundBlur,
        toggleBackgroundBlur,
        isVideoEnabled,
        facingMode,
        isBackgroundBlurSupported,
    } = useVideoToggle(switchActiveDevice);

    const { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled } = useAudioToggle(
        switchActiveDevice,
        krispAudioContext
    );

    const { handlePreviewCameraToggle, cleanupCameraPreview, cleanupPreviewTrack } = useCameraPreview({
        selectedCameraId: activeCameraDeviceId,
        facingMode: 'user',
        isBackgroundBlurSupported,
        backgroundBlur,
        room,
    });

    const cameraPermission = useMeetSelector(selectCameraPermission);
    const microphonePermission = useMeetSelector(selectMicrophonePermission);

    useEffect(() => {
        if (cameraPermission === 'denied') {
            if (room.state === ConnectionState.Connected) {
                void room.localParticipant.setCameraEnabled(false);
            } else {
                dispatch(setInitialCameraState(false));
            }
        }
    }, [cameraPermission, room, dispatch]);

    useEffect(() => {
        if (microphonePermission === 'denied') {
            if (room.state === ConnectionState.Connected) {
                void room.localParticipant.setMicrophoneEnabled(false);
            } else {
                dispatch(setInitialAudioState(false));
            }
        }
    }, [microphonePermission, room, dispatch]);

    const initializeCamera = async (camState: boolean) => {
        try {
            // Always publish the video track (and mute if camera is off at join) so E2EE transforms are set up
            // as part of the initial SDP offer rather than a post-connect renegotiation.
            // With H264 and simulcast, renegotiation has a race where the hardware encoder produces the first keyframes
            // before the E2EE InsertableStreams transform is attached to the simulcast senders, sending unencrypted frames.
            const result = await toggleVideo({
                videoDeviceId: selectedCameraId,
                isEnabled: true,
                preserveCache: true,
            });

            if (!result) {
                throw new Error('Failed to initialize camera');
            }

            // If the user joined with camera off, mute the track immediately.
            // The track stays published in the SFU so E2EE transforms remain attached,
            // avoiding the renegotiation race when the user enables camera later.
            if (!camState) {
                const videoPublication = [...room.localParticipant.videoTrackPublications.values()].find(
                    (pub) => pub.source === Track.Source.Camera
                );
                if (videoPublication?.track) {
                    await videoPublication.track.mute();
                }
            }
        } catch (error) {
            reportMeetError('Failed to initialize camera', error);
            throw error;
        }
    };

    const initializeMicrophone = async (audioState: boolean) => {
        try {
            setAudioSessionType('auto');

            const audioConstraints = {
                autoGainControl: true,
                echoCancellation: true,
                noiseSuppression: true,
            };

            await room.localParticipant.setMicrophoneEnabled(true, audioConstraints);

            setAudioSessionType('play-and-record');

            // If starting muted, mute the track (keeps it published but silent)
            if (!audioState) {
                const audioPublication = [...room.localParticipant.audioTrackPublications.values()].find(
                    (pub) => pub.kind === Track.Kind.Audio && pub.source !== Track.Source.ScreenShare
                );

                if (audioPublication?.track) {
                    await audioPublication.track.mute();
                }
            } else {
                const result = await toggleAudio({
                    audioDeviceId: selectedMicrophoneId,
                    isEnabled: true,
                    preserveCache: true,
                });

                if (!result) {
                    throw new Error('Failed to initialize microphone');
                }
            }
        } catch (error) {
            reportMeetError('Failed to initialize microphone', error);
            throw error;
        }
    };

    const initializeAudioOutput = async (audioOutputState: boolean) => {
        try {
            if (audioOutputState) {
                await switchActiveDevice({
                    deviceType: 'audiooutput',
                    deviceId: selectedAudioOutputDeviceId,
                    isSystemDefaultDevice: speakerState.useSystemDefault,
                });
            }
        } catch (error) {
            reportMeetError('Failed to initialize audio output', error);
            throw error;
        }
    };

    const initializeDevices = async (timeoutMs?: number) => {
        const initializeDevicesInternal = async () => {
            await cleanupCameraPreview();

            await wait(200);

            await cleanupMicrophoneVolumeAnalysis();

            const results = await Promise.allSettled([
                // Do not initialize camera if permission is not granted
                cameraPermission === 'granted' ? initializeCamera(initialCameraState) : Promise.resolve(),
                // Do not initialize microphone if permission is not granted
                microphonePermission === 'granted' ? initializeMicrophone(initialAudioState) : Promise.resolve(),
                initializeAudioOutput(true),
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

        if (timeoutMs !== undefined) {
            try {
                const initializeDevicesPromise = initializeDevicesInternal();
                const timeoutPromise = new Promise<void>((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, timeoutMs);
                });

                await Promise.race([initializeDevicesPromise, timeoutPromise]);
            } catch (error) {
                reportMeetError('Failed to initialize devices, continuing anyway', error);
            }
        } else {
            await initializeDevicesInternal();
        }
    };

    useDeviceData();

    const { permissionsLoading } = useDevicePermissionChangeListener();

    useDynamicDeviceHandling({
        toggleAudio,
        toggleVideo,
        switchActiveDevice,
    });

    const initializedDevices = useRef({
        video: false,
        audio: false,
        audioOutput: false,
    });

    useEffect(() => {
        const cameraInitDeviceId = preferredCameraId ?? cameraState.systemDefault?.deviceId;
        if (!initializedDevices.current.video && cameraInitDeviceId) {
            void switchActiveDevice({
                deviceType: 'videoinput',
                deviceId: cameraInitDeviceId,
                isSystemDefaultDevice: cameraState.useSystemDefault,
            });
            initializedDevices.current.video = true;
        }

        const microphoneInitDeviceId = preferredMicrophoneId ?? microphoneState.systemDefault?.deviceId;
        if (!initializedDevices.current.audio && microphoneInitDeviceId) {
            void switchActiveDevice({
                deviceType: 'audioinput',
                deviceId: microphoneInitDeviceId,
                isSystemDefaultDevice: microphoneState.useSystemDefault,
            });
            initializedDevices.current.audio = true;
        }

        const speakerInitDeviceId = preferredSpeakerId ?? speakerState.systemDefault?.deviceId;
        if (!initializedDevices.current.audioOutput && speakerInitDeviceId) {
            void switchActiveDevice({
                deviceType: 'audiooutput',
                deviceId: speakerInitDeviceId,
                isSystemDefaultDevice: speakerState.useSystemDefault,
            });
            initializedDevices.current.audioOutput = true;
        }
    }, [
        switchActiveDevice,
        preferredCameraId,
        preferredMicrophoneId,
        preferredSpeakerId,
        cameraState.systemDefault?.deviceId,
        microphoneState.systemDefault?.deviceId,
        speakerState.systemDefault?.deviceId,
    ]);

    const cleanupPreviews = useStableCallback(async () => {
        await cleanupCameraPreview();
        await cleanupMicrophoneVolumeAnalysis();
    });

    useEffect(() => {
        const wasConnectedRef = { current: false };
        const cleanupInProgressRef = { current: false };

        const handleCleanup = async (shouldCleanupPreviews: boolean = true) => {
            if (cleanupInProgressRef.current) {
                return;
            }

            cleanupInProgressRef.current = true;

            const localParticipant = room.localParticipant;

            // Snapshot track references before any async operations
            // LiveKit may clear trackPublications during disconnect/unpublish
            const tracks = [...localParticipant.trackPublications.values()]
                .map((pub) => pub.track)
                .filter((track): track is LocalTrack => !!track);

            try {
                await Promise.allSettled([
                    localParticipant.setScreenShareEnabled(false),
                    localParticipant.setCameraEnabled(false),
                    localParticipant.setMicrophoneEnabled(false),
                    shouldCleanupPreviews ? cleanupPreviews() : Promise.resolve(),
                ]);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }

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
            void handleCleanup(false);
        };

        room.on(RoomEvent.Connected, handleConnected);
        room.on(RoomEvent.Disconnected, handleDisconnected);

        return () => {
            room.off(RoomEvent.Connected, handleConnected);
            room.off(RoomEvent.Disconnected, handleDisconnected);

            void handleCleanup(true);
        };
    }, []);

    useEffect(() => {
        void preloadBackgroundProcessorAssets();
    }, []);

    return (
        <MediaManagementContext.Provider
            value={{
                handlePreviewCameraToggle,
                cleanupPreviewTrack,
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
                switchActiveDevice,
                initializeDevices,
                getMicrophoneVolumeAnalysis,
                initializeMicrophoneVolumeAnalysis,
                cleanupMicrophoneVolumeAnalysis,
            }}
        >
            {!permissionsLoading && <PermissionsModal />}
            {children}
        </MediaManagementContext.Provider>
    );
};
