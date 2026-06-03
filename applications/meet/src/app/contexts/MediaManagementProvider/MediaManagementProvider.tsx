import { useCallback, useEffect, useRef } from 'react';

import { useRoomContext } from '@livekit/components-react';
import type { LocalTrack } from 'livekit-client';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import {
    setInitialAudioState,
    setInitialCameraState,
    setPreferredDeviceAndPersist,
} from '@proton/meet/store/slices/deviceManagementSlice';
import {
    selectActiveAudioOutputId,
    selectActiveCameraId,
    selectActiveMicrophoneId,
    selectCameraPermission,
    selectCameras,
    selectInitialAudioState,
    selectInitialCameraState,
    selectMicrophonePermission,
    selectMicrophoneState,
    selectMicrophones,
    selectPreferredCameraId,
    selectPreferredMicrophoneId,
    selectPreferredSpeakerId,
    selectRealtimeDevices,
    selectSelectedAudioOutputId,
    selectSelectedCameraId,
    selectSelectedMicrophoneId,
    selectSpeakerState,
    selectSpeakers,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { setAudioSessionType } from '@proton/meet/utils/iosAudioSession';
import { TimeoutError, withTimeout } from '@proton/meet/utils/withTimeout';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useDeviceData } from '../../hooks/bridges/useDeviceData';
import { useStableCallback } from '../../hooks/useStableCallback';
import { preloadBackgroundProcessorAssets } from '../../processors/background-processor/createBackgroundProcessor';
import type { SwitchActiveDevice } from '../../types';
import { supportsSetSinkId } from '../../utils/browser';
import { isRNNoiseFilterSupported, preloadRNNoiseWorkletAsset } from '../../utils/rnnoiseProcessor';
import { MediaManagementContext } from './MediaManagementContext';
import { PermissionsModal } from './PermissionsModal/PermissionsModal';
import { useAudioToggle } from './mediaToggle/useAudioToggle';
import { useVideoToggle } from './mediaToggle/useVideoToggle';
import { useCameraPreview } from './useCameraPreview';
import { useDeviceListSync } from './useDeviceListSync';
import { useDevicePermissionChangeListener } from './useDevicePermissionChangeListener';
import { useDynamicDeviceHandling } from './useDynamicDeviceHandling';
import { useMicrophoneVolumeAnalysis } from './useMicrophoneVolumeAnalysis';

const SWITCH_DEVICE_TIMEOUT_MS = 5000;

export const MediaManagementProvider = ({ children }: { children: React.ReactNode }) => {
    const room = useRoomContext();
    const { createNotification } = useNotifications();
    const { reportMeetError } = useMeetErrorReporting();
    const dispatch = useMeetDispatch();
    const store = useMeetStore();

    useDeviceListSync();

    const initialCameraState = useMeetSelector(selectInitialCameraState);
    const initialAudioState = useMeetSelector(selectInitialAudioState);

    const activeMicrophoneDeviceId = useMeetSelector(selectActiveMicrophoneId);
    const activeAudioOutputDeviceId = useMeetSelector(selectActiveAudioOutputId);
    const activeCameraDeviceId = useMeetSelector(selectActiveCameraId);

    const selectedCameraId = useMeetSelector(selectSelectedCameraId);
    const selectedMicrophoneId = useMeetSelector(selectSelectedMicrophoneId);
    const selectedAudioOutputDeviceId = useMeetSelector(selectSelectedAudioOutputId);

    const cameras = useMeetSelector(selectCameras);
    const microphones = useMeetSelector(selectMicrophones);
    const speakers = useMeetSelector(selectSpeakers);
    const microphoneState = useMeetSelector(selectMicrophoneState);
    const speakerState = useMeetSelector(selectSpeakerState);

    const preferredCameraId = useMeetSelector(selectPreferredCameraId);
    const preferredMicrophoneId = useMeetSelector(selectPreferredMicrophoneId);
    const preferredSpeakerId = useMeetSelector(selectPreferredSpeakerId);

    const { getMicrophoneVolumeAnalysis, initializeMicrophoneVolumeAnalysis, cleanupMicrophoneVolumeAnalysis } =
        useMicrophoneVolumeAnalysis();

    const switchActiveDevice: SwitchActiveDevice = useCallback(
        async ({
            deviceType,
            deviceId,
            isSystemDefaultDevice,
            preserveDefaultDevice = false,
            throwOnError = false,
        }) => {
            if ((deviceType === 'audiooutput' && !supportsSetSinkId()) || isMobile()) {
                return;
            }

            let selectedDeviceId = deviceId;

            const activeDeviceIdByType: Record<'audioinput' | 'audiooutput' | 'videoinput', string> = {
                audioinput: activeMicrophoneDeviceId,
                audiooutput: activeAudioOutputDeviceId,
                videoinput: activeCameraDeviceId,
            };

            try {
                try {
                    if (activeDeviceIdByType[deviceType] !== selectedDeviceId) {
                        await withTimeout(
                            room.switchActiveDevice(deviceType, deviceId),
                            'Switch active device',
                            SWITCH_DEVICE_TIMEOUT_MS
                        );
                    }
                } catch (error) {
                    if (deviceType !== 'videoinput' || error instanceof TimeoutError) {
                        throw error;
                    }

                    const enumerated = await selectRealtimeDevices(store, deviceType);
                    const fallback = enumerated.find((d) => d.deviceId && d.deviceId !== deviceId);

                    if (!fallback) {
                        throw error;
                    }

                    selectedDeviceId = fallback.deviceId;

                    // eslint-disable-next-line no-console
                    console.warn(`[switchActiveDevice] videoinput fallback`, {
                        deviceType,
                        deviceId: selectedDeviceId,
                        errorName: (error as Error)?.name,
                        errorMessage: (error as Error)?.message,
                        error,
                    });

                    await withTimeout(
                        room.switchActiveDevice(deviceType, selectedDeviceId),
                        `room.switchActiveDevice(${deviceType}) fallback`,
                        SWITCH_DEVICE_TIMEOUT_MS
                    );
                }
            } catch (error) {
                if (throwOnError) {
                    throw error;
                } else {
                    reportMeetError('Failed to switch active device', error);
                    return;
                }
            }

            if (preserveDefaultDevice) {
                return;
            }

            const toSave = isSystemDefaultDevice ? null : selectedDeviceId;
            dispatch(setPreferredDeviceAndPersist({ kind: deviceType, deviceId: toSave }));
        },
        [
            activeMicrophoneDeviceId,
            activeAudioOutputDeviceId,
            activeCameraDeviceId,
            dispatch,
            room,
            store,
            reportMeetError,
        ]
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

    const { toggleAudio, noiseFilter, toggleNoiseFilter, isAudioEnabled } = useAudioToggle(switchActiveDevice);

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
                updateUserIntent: false,
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
        if (!initializedDevices.current.video && cameras.length) {
            const cameraInitDeviceId =
                cameras.find((camera) => camera.deviceId === preferredCameraId)?.deviceId || cameras[0]?.deviceId || '';

            void switchActiveDevice({
                deviceType: 'videoinput',
                deviceId: cameraInitDeviceId,
                isSystemDefaultDevice: false,
                preserveDefaultDevice: true,
            });
            initializedDevices.current.video = true;
        }

        if (!initializedDevices.current.audio && microphones.length) {
            const microphoneInitDeviceId =
                microphones.find((microphone) => microphone.deviceId === preferredMicrophoneId)?.deviceId ||
                microphoneState.systemDefault?.deviceId ||
                '';
            void switchActiveDevice({
                deviceType: 'audioinput',
                deviceId: microphoneInitDeviceId,
                isSystemDefaultDevice: microphoneState.useSystemDefault,
                preserveDefaultDevice: true,
            });
            initializedDevices.current.audio = true;
        }

        if (!initializedDevices.current.audioOutput && speakers.length) {
            const speakerInitDeviceId =
                speakers.find((speaker) => speaker.deviceId === preferredSpeakerId)?.deviceId ||
                speakerState.systemDefault?.deviceId ||
                '';
            void switchActiveDevice({
                deviceType: 'audiooutput',
                deviceId: speakerInitDeviceId,
                isSystemDefaultDevice: speakerState.useSystemDefault,
                preserveDefaultDevice: true,
            });
            initializedDevices.current.audioOutput = true;
        }
    }, [
        cameras,
        microphones,
        speakers,
        microphoneState.systemDefault?.deviceId,
        microphoneState.useSystemDefault,
        preferredCameraId,
        preferredMicrophoneId,
        preferredSpeakerId,
        speakerState.systemDefault?.deviceId,
        speakerState.useSystemDefault,
        switchActiveDevice,
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
    }, [cleanupPreviews, room]);

    useEffect(() => {
        void preloadBackgroundProcessorAssets();
        if (isRNNoiseFilterSupported()) {
            preloadRNNoiseWorkletAsset();
        }
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
